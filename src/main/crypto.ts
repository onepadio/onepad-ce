// REPLACED: Using Electron's safeStorage instead of keytar to avoid native module packaging issues
import { safeStorage } from 'electron';
import crypto from 'crypto';
import Store from 'electron-store';

const store = new Store();
const MASTER_KEY_STORE_KEY = 'encrypted_master_key';

export function createMasterKeyIfNotExists() {
  // Check if master key exists in store
  const encryptedKey = store.get(MASTER_KEY_STORE_KEY) as string | undefined;

  if (!encryptedKey && safeStorage.isEncryptionAvailable()) {
    // Generate a random master key for aes-128-cbc
    const randomKey = crypto.randomBytes(16).toString('hex');

    // Encrypt and store the master key using Electron's safeStorage
    const encrypted = safeStorage.encryptString(randomKey);
    store.set(MASTER_KEY_STORE_KEY, encrypted.toString('base64'));
    console.log('Master key created and encrypted');
  }
}

export async function getMasterKey(): Promise<string> {
  const encryptedKey = store.get(MASTER_KEY_STORE_KEY) as string | undefined;

  if (!encryptedKey) {
    throw new Error('Master key not found');
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system');
  }

  // Decrypt the master key
  const buffer = Buffer.from(encryptedKey, 'base64');
  const decrypted = safeStorage.decryptString(buffer);

  return decrypted;
}


export function decryptFunc(encPasswd: string, key: any) {
  // Convert key to buffer
  const keyBuffer = Buffer.from(key, 'hex');

  // Create initialization vector (IV) of 16 bytes filled with spaces
  const initializationVector = Buffer.alloc(16, ' ');

  // Remove prefix from encrypted password (assuming first 3 bytes)
  const encPasswdWithoutPrefix = encPasswd.slice(3);

  // Decode the encrypted password from base64
  const encryptedBuffer = Buffer.from(encPasswdWithoutPrefix, 'base64');

  // Create decipher object
  const decipher = crypto.createDecipheriv(
    'aes-128-cbc',
    keyBuffer,
    initializationVector
  );

  // Perform decryption
  let decrypted = decipher.update(encryptedBuffer.toString('binary'), 'binary', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted.trim(); // Remove leading/trailing whitespace
}

export function encryptFunc(passwd: string, key: any) {
  // Convert key to buffer
  const keyBuffer = Buffer.from(key, 'hex');

  // Create initialization vector (IV) of 16 bytes filled with spaces
  const initializationVector = Buffer.alloc(16, ' ');

  // Create cipher object
  const cipher = crypto.createCipheriv(
    'aes-128-cbc',
    keyBuffer,
    initializationVector
  );

  // Perform encryption
  let encrypted = cipher.update(passwd, 'utf8', 'binary');
  encrypted += cipher.final('binary');

  // Convert encrypted password to base64
  const encPasswdBase64 = Buffer.from(encrypted, 'binary').toString('base64');

  // Add prefix to encrypted password (assuming first 3 bytes)
  const encPasswd = 'v10' + encPasswdBase64;

  return encPasswd;
}
