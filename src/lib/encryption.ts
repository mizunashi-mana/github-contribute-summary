import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

export class TokenEncryption {
  private getKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  encrypt(token: string, password?: string): string {
    if (!password) {
      password = process.env.ENCRYPTION_PASSWORD || 'default-key';
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getKey(password, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Format: salt:iv:encrypted (CBC doesn't have auth tag)
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData: string, password?: string): string {
    if (!password) {
      password = process.env.ENCRYPTION_PASSWORD || 'default-key';
    }

    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [saltHex, ivHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const key = this.getKey(password, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  isEncrypted(value: string): boolean {
    // Check if the value looks like encrypted format (3 parts separated by colons)
    const parts = value.split(':');
    return parts.length === 3 && parts.every(part => /^[a-f0-9]+$/i.test(part));
  }
}

export function getDecryptedToken(envValue?: string): string | undefined {
  if (!envValue) return undefined;

  const encryption = new TokenEncryption();

  // If it looks encrypted, try to decrypt it
  if (encryption.isEncrypted(envValue)) {
    try {
      return encryption.decrypt(envValue);
    }
    catch (error) {
      console.error('Failed to decrypt GitHub token:', error);
      return undefined;
    }
  }

  // Otherwise, treat as plain text
  return envValue;
}
