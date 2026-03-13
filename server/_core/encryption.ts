/**
 * AES-256-GCM encryption for sensitive PII fields (SSN, EIN, DOB).
 * Key is read from ENCRYPTION_KEY env var (must be 32-byte hex = 64 hex chars).
 *
 * Format of encrypted value stored in DB:
 *   iv_hex:authTag_hex:ciphertext_hex
 *
 * Usage:
 *   const encrypted = encrypt(ssn);   // store this
 *   const plain = decrypt(encrypted); // read this
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    // In development without a key, use a deterministic dev key (NEVER in production)
    if (process.env.NODE_ENV !== "production") {
      return Buffer.from("0".repeat(64), "hex");
    }
    throw new Error("ENCRYPTION_KEY environment variable is required in production");
  }
  if (keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypts a plaintext string. Returns iv:authTag:ciphertext (all hex).
 * Returns null if input is null/undefined/empty.
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null;

  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts an encrypted string. Returns original plaintext.
 * Returns null if input is null/undefined/empty.
 * Returns the input as-is if it doesn't match the expected format
 * (handles legacy unencrypted rows gracefully).
 */
export function decrypt(encryptedValue: string | null | undefined): string | null {
  if (!encryptedValue) return null;

  // Handle legacy unencrypted values (don't crash — just return them)
  const parts = encryptedValue.split(":");
  if (parts.length !== 3) {
    console.warn("[encryption] decrypt: value does not match expected format — returning as-is (legacy row?)");
    return encryptedValue;
  }

  try {
    const key = getKey();
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[encryption] decrypt failed:", err);
    return null;
  }
}

/**
 * Returns true if a value is already encrypted (has iv:tag:data format).
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.split(":").length === 3;
}

/**
 * Encrypts only if not already encrypted (safe to call on re-saves).
 */
export function encryptIfNeeded(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isEncrypted(value)) return value;
  return encrypt(value);
}
