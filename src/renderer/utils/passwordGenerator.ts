/**
 * Password Generator Utility
 * Generates strong, random passwords with customizable options
 */

export interface PasswordGeneratorOptions {
  length?: number;
  lowercase?: boolean;
  uppercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeSimilar?: boolean; // Exclude similar looking characters (0, O, 1, l, etc.)
  excludeAmbiguous?: boolean; // Exclude ambiguous symbols
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

const SIMILAR_CHARS = '0O1lI';
const AMBIGUOUS_SYMBOLS = '{}[]()/\\\'"`~,;:.<>';

/**
 * Generate a strong random password
 */
export function generatePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 16,
    lowercase = true,
    uppercase = true,
    numbers = true,
    symbols = true,
    excludeSimilar = false,
    excludeAmbiguous = false
  } = options;

  if (length < 4) {
    throw new Error('Password length must be at least 4 characters');
  }

  // Build character set
  let charset = '';
  let requiredChars: string[] = [];

  if (lowercase) {
    let chars = LOWERCASE;
    if (excludeSimilar) {
      chars = chars.replace(/[l]/g, '');
    }
    charset += chars;
    requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  if (uppercase) {
    let chars = UPPERCASE;
    if (excludeSimilar) {
      chars = chars.replace(/[OI]/g, '');
    }
    charset += chars;
    requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  if (numbers) {
    let chars = NUMBERS;
    if (excludeSimilar) {
      chars = chars.replace(/[01]/g, '');
    }
    charset += chars;
    requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  if (symbols) {
    let chars = SYMBOLS;
    if (excludeAmbiguous) {
      chars = chars.split('').filter(c => !AMBIGUOUS_SYMBOLS.includes(c)).join('');
    }
    charset += chars;
    requiredChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  // Generate password ensuring at least one character from each selected type
  let password = [...requiredChars];

  // Fill remaining length with random characters
  for (let i = requiredChars.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password.push(charset[randomIndex]);
  }

  // Shuffle the password to avoid predictable patterns
  password = shuffleArray(password);

  return password.join('');
}

/**
 * Generate multiple password suggestions
 */
export function generatePasswordSuggestions(count: number = 3, options: PasswordGeneratorOptions = {}): string[] {
  const suggestions: string[] = [];
  
  for (let i = 0; i < count; i++) {
    suggestions.push(generatePassword(options));
  }
  
  return suggestions;
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length score
  if (password.length >= 16) {
    score += 30;
  } else if (password.length >= 12) {
    score += 20;
    feedback.push('Consider using 16+ characters for stronger security');
  } else if (password.length >= 8) {
    score += 10;
    feedback.push('Password is too short. Use at least 12 characters');
  } else {
    feedback.push('Password is very short. Use at least 12 characters');
  }

  // Character variety
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
  score += varietyCount * 15;

  if (!hasLowercase) feedback.push('Add lowercase letters');
  if (!hasUppercase) feedback.push('Add uppercase letters');
  if (!hasNumbers) feedback.push('Add numbers');
  if (!hasSymbols) feedback.push('Add symbols');

  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 10;
    feedback.push('Avoid repeating characters');
  }

  if (/^[0-9]+$/.test(password)) {
    score -= 20;
    feedback.push('Numeric-only passwords are weak');
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 15;
    feedback.push('Add numbers and symbols');
  }

  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    score -= 10;
    feedback.push('Avoid sequential characters');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  if (score >= 80) {
    level = 'very-strong';
  } else if (score >= 60) {
    level = 'strong';
  } else if (score >= 40) {
    level = 'fair';
  } else if (score >= 20) {
    level = 'weak';
  } else {
    level = 'very-weak';
  }

  return { score, level, feedback };
}

/**
 * Generate memorable passphrase (word-based password)
 */
export function generatePassphrase(wordCount: number = 4, separator: string = '-'): string {
  // Using a subset of common English words (in production, use a proper wordlist like EFF's)
  const wordList = [
    'apple', 'bridge', 'castle', 'dragon', 'eagle', 'forest', 'garden', 'harbor',
    'island', 'jungle', 'knight', 'lightning', 'mountain', 'night', 'ocean', 'palace',
    'queen', 'river', 'storm', 'thunder', 'universe', 'valley', 'winter', 'zenith',
    'amber', 'bronze', 'crystal', 'diamond', 'emerald', 'flame', 'golden', 'horizon',
    'iron', 'jade', 'karma', 'lunar', 'mystic', 'nova', 'omega', 'phoenix',
    'quantum', 'rainbow', 'silver', 'titan', 'ultra', 'vortex', 'wisdom', 'xenon'
  ];

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    words.push(wordList[randomIndex]);
  }

  return words.join(separator);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if password has been compromised (stub for future HaveIBeenPwned integration)
 */
export async function checkPasswordBreach(password: string): Promise<{ breached: boolean; count?: number }> {
  // TODO: Implement HaveIBeenPwned API integration
  // For now, just return not breached
  return { breached: false };
}

export default {
  generatePassword,
  generatePasswordSuggestions,
  calculatePasswordStrength,
  generatePassphrase,
  checkPasswordBreach
};
