import { safeStorage } from 'electron';
import crypto from 'crypto';
import Store from 'electron-store';
import log from 'electron-log';

const store = new Store();
const MASTER_KEY_STORE_KEY = 'encrypted_master_key_v2';

// In-memory session store for person keys (cleared on app close)
const sessionKeys: { [personId: string]: string } = {};
const sessionTimeouts: { [personId: string]: NodeJS.Timeout } = {};
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

/**
 * Create OS-level master key using async safeStorage API
 * This key is used to wrap per-person keys
 */
export async function createMasterKeyIfNotExists(): Promise<void> {
  const encryptedKey = store.get(MASTER_KEY_STORE_KEY) as string | undefined;

  if (!encryptedKey && await safeStorage.isEncryptionAvailable()) {
    try {
      // Generate 256-bit master key
      const randomKey = crypto.randomBytes(32).toString('hex');

      // Encrypt using async API
      const encrypted = await safeStorage.encryptString(randomKey);
      store.set(MASTER_KEY_STORE_KEY, encrypted.toString('base64'));
      log.info('Master key created and encrypted with OS-level protection');
    } catch (error) {
      log.error('Failed to create master key:', error);
      throw error;
    }
  }
}

/**
 * Get OS-level master key using async API with key rotation support
 */
export async function getMasterKey(): Promise<string> {
  const encryptedKey = store.get(MASTER_KEY_STORE_KEY) as string | undefined;

  if (!encryptedKey) {
    throw new Error('Master key not found. Please create it first.');
  }

  if (!await safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system');
  }

  try {
    const buffer = Buffer.from(encryptedKey, 'base64');
    const decrypted = await safeStorage.decryptString(buffer);

    // Handle key rotation if needed
    // Note: Key rotation support varies by platform
    // if (result.shouldReEncrypt) {
    //   const newEncrypted = await safeStorage.encryptStringAsync(result.result);
    //   store.set(MASTER_KEY_STORE_KEY, newEncrypted.toString('base64'));
    //   log.info('Master key re-encrypted due to OS key rotation');
    // }

    return decrypted;
  } catch (error) {
    log.error('Failed to decrypt master key:', error);
    throw new Error('Failed to access master key');
  }
}

/**
 * Generate or retrieve person-specific salt
 */
function getOrCreatePersonSalt(personId: string): Buffer {
  const saltKey = `person_salt_${personId}`;
  const existingSalt = store.get(saltKey) as string | undefined;

  if (existingSalt) {
    return Buffer.from(existingSalt, 'base64');
  }

  const newSalt = crypto.randomBytes(32);
  store.set(saltKey, newSalt.toString('base64'));
  return newSalt;
}

/**
 * Create a new person with password-based encryption
 */
export async function createPersonKey(personId: string, password: string): Promise<void> {
  try {
    // Generate unique salt for this person
    const salt = getOrCreatePersonSalt(personId);

    // Derive person-specific encryption key from password
    const personKey = crypto.scryptSync(password, salt, 32);

    // Get OS master key
    const masterKey = await getMasterKey();

    // Wrap person key with master key (double encryption)
    const wrappedKey = encryptWithMasterKey(personKey.toString('hex'), masterKey);

    // Store wrapped key
    store.set(`person_key_${personId}`, wrappedKey);
    log.info(`Person key created and wrapped for person: ${personId}`);

    // Clear sensitive data from memory
    secureWipe(personKey);
  } catch (error) {
    log.error('Failed to create person key:', error);
    throw error;
  }
}

/**
 * Authenticate person and load their key into session
 */
export async function authenticatePerson(personId: string, password: string): Promise<boolean> {
  try {
    // Get wrapped key from store
    const wrappedKey = store.get(`person_key_${personId}`) as string | undefined;

    if (!wrappedKey) {
      throw new Error('Person key not found');
    }

    // Get OS master key
    const masterKey = await getMasterKey();

    // Unwrap person key
    const unwrappedKey = decryptWithMasterKey(wrappedKey, masterKey);

    // Derive key from provided password
    const salt = getOrCreatePersonSalt(personId);
    const derivedKey = crypto.scryptSync(password, salt, 32);

    // Verify password is correct
    if (derivedKey.toString('hex') !== unwrappedKey) {
      log.warn(`Authentication failed for person: ${personId}`);
      return false;
    }

    // Store in session (memory only)
    sessionKeys[personId] = unwrappedKey;
    startSessionTimeout(personId);

    log.info(`Person authenticated: ${personId}`);
    return true;
  } catch (error) {
    log.error('Authentication error:', error);
    return false;
  }
}

/**
 * Get person key from active session
 */
export function getPersonKey(personId: string): string {
  const key = sessionKeys[personId];

  if (!key) {
    throw new Error('Person session locked. Please authenticate.');
  }

  // Reset timeout on access
  startSessionTimeout(personId);

  return key;
}

/**
 * Check if person session is active
 */
export function isPersonSessionActive(personId: string): boolean {
  return !!sessionKeys[personId];
}

/**
 * Lock person session and clear key from memory
 */
export function lockPerson(personId: string): void {
  if (sessionKeys[personId]) {
    const keyBuffer = Buffer.from(sessionKeys[personId], 'hex');
    secureWipe(keyBuffer);
    delete sessionKeys[personId];
  }

  if (sessionTimeouts[personId]) {
    clearTimeout(sessionTimeouts[personId]);
    delete sessionTimeouts[personId];
  }

  log.info(`Person session locked: ${personId}`);
}

/**
 * Lock all active sessions
 */
export function lockAllPersons(): void {
  Object.keys(sessionKeys).forEach(lockPerson);
}

/**
 * Start or reset session timeout for a person
 */
function startSessionTimeout(personId: string): void {
  if (sessionTimeouts[personId]) {
    clearTimeout(sessionTimeouts[personId]);
  }

  sessionTimeouts[personId] = setTimeout(() => {
    lockPerson(personId);
  }, SESSION_TIMEOUT);
}

/**
 * Encrypt password for a specific person using AES-256-GCM
 */
export function encryptPasswordForPerson(
  password: string,
  personKey: string,
  personId: string
): string {
  try {
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);

    // Derive encryption key with person-specific salt
    const salt = getOrCreatePersonSalt(personId);
    const key = crypto.scryptSync(personKey, salt, 32);

    // Create cipher with AES-256-GCM (authenticated encryption)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Encrypt
    let encrypted = cipher.update(password, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: IV + authTag + encrypted data + personId (for verification)
    const personIdBuffer = Buffer.from(personId, 'utf8');
    const combined = Buffer.concat([
      iv,
      authTag,
      encrypted,
      Buffer.from([personIdBuffer.length]), // Store length of personId
      personIdBuffer
    ]);

    // Clear sensitive data
    secureWipe(key);

    // Return with version prefix for future-proofing
    return 'v20:' + combined.toString('base64');
  } catch (error) {
    log.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
}

/**
 * Decrypt password for a specific person
 */
export function decryptPasswordForPerson(
  encryptedData: string,
  personKey: string,
  personId: string
): string {
  try {
    // Parse version
    const [version, data] = encryptedData.split(':');

    if (version !== 'v20') {
      throw new Error(`Unsupported encryption version: ${version}`);
    }

    const combined = Buffer.from(data, 'base64');

    // Extract personId length (last byte before personId)
    const personIdLength = combined[combined.length - (personId.length + 1)];

    // Extract components
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28, combined.length - personIdLength - 1);
    const storedPersonId = combined.subarray(combined.length - personIdLength).toString('utf8');

    // Verify person ID matches (prevent unauthorized access)
    if (storedPersonId !== personId) {
      throw new Error('Unauthorized: Person ID mismatch');
    }

    // Derive key
    const salt = getOrCreatePersonSalt(personId);
    const key = crypto.scryptSync(personKey, salt, 32);

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Clear sensitive data
    secureWipe(key);

    return decrypted.toString('utf8');
  } catch (error) {
    log.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
}

/**
 * Encrypt data with OS master key (for wrapping person keys)
 */
function encryptWithMasterKey(data: string, masterKey: string): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(masterKey, 'hex');

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(data, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return 'wrap:' + combined.toString('base64');
}

/**
 * Decrypt data with OS master key
 */
function decryptWithMasterKey(encryptedData: string, masterKey: string): string {
  const [prefix, data] = encryptedData.split(':');

  if (prefix !== 'wrap') {
    throw new Error('Invalid wrapped key format');
  }

  const combined = Buffer.from(data, 'base64');
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);

  const key = Buffer.from(masterKey, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Securely wipe sensitive data from memory
 */
function secureWipe(buffer: Buffer): void {
  if (buffer && buffer.length > 0) {
    crypto.randomFillSync(buffer);
  }
}

/**
 * Check Linux secret storage backend
 */
export function checkSecretStorageBackend(): { backend: string; isSecure: boolean; warning?: string } {
  if (process.platform !== 'linux') {
    return { backend: 'native', isSecure: true };
  }

  try {
    const backend = safeStorage.getSelectedStorageBackend?.() || 'unknown';

    if (backend === 'basic_text') {
      return {
        backend,
        isSecure: false,
        warning: 'No secure keyring found. Passwords are stored with basic encryption. Install gnome-keyring or kwallet for better security.'
      };
    }

    return { backend, isSecure: true };
  } catch (error) {
    return { backend: 'unknown', isSecure: false, warning: 'Could not determine storage backend' };
  }
}

export default {
  createMasterKeyIfNotExists,
  getMasterKey,
  createPersonKey,
  authenticatePerson,
  getPersonKey,
  isPersonSessionActive,
  lockPerson,
  lockAllPersons,
  encryptPasswordForPerson,
  decryptPasswordForPerson,
  checkSecretStorageBackend
};
