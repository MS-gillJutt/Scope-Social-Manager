import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * @param plaintext The text to encrypt
 * @param keyHex 32-byte (64 hex characters) encryption key
 * @returns Serialized encrypted string in format: `iv:authTag:ciphertext` (all hex)
 */
export function encrypt(plaintext: string, keyHex: string): string {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("Encryption key must be a 64-character hex string (32 bytes)");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a serialized AES-256-GCM ciphertext.
 * @param encryptedString Serialized string in format `iv:authTag:ciphertext` (all hex)
 * @param keyHex 32-byte (64 hex characters) encryption key
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedString: string, keyHex: string): string {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("Encryption key must be a 64-character hex string (32 bytes)");
  }

  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected 'iv:authTag:ciphertext'");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error("Malformed encrypted token parts");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
