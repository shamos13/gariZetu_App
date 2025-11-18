import * as Crypto from 'expo-crypto';

/**
 * Hash a password using SHA-256
 * In production, consider using bcrypt or a more secure hashing algorithm
 */
export const hashPassword = async (password: string): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
};

/**
 * Verify a password against a hash
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

