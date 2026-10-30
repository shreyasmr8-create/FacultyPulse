import bcrypt from "bcryptjs";

const BCRYPT_COST = 10; // F1.5 & SEC3

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_COST);
}

export async function verifyPassword(
  plainText: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, passwordHash);
}
