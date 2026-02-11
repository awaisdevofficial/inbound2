import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

/**
 * Generates a TOTP secret and QR code for 2FA setup
 * @param email - User's email address
 * @param issuer - Application name (default: "Inbound Genie")
 * @returns Setup data including secret, QR code URL, and manual entry key
 */
export async function generateTwoFactorSetup(
  email: string,
  issuer: string = "Inbound Genie"
): Promise<TwoFactorSetup> {
  // Generate a random secret (20 bytes recommended for security)
  const secret = new OTPAuth.Secret({ size: 20 });

  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // Generate QR code data URL
  const qrCodeUrl = await QRCode.toDataURL(totp.toString());

  // Format secret for manual entry (add spaces every 4 characters)
  const secretBase32 = secret.base32;
  const manualEntryKey = secretBase32.match(/.{1,4}/g)?.join(" ") || secretBase32;

  return {
    secret: secretBase32,
    qrCodeUrl,
    manualEntryKey,
  };
}

/**
 * Verifies a TOTP token
 * @param secret - The TOTP secret
 * @param token - The 6-digit token to verify
 * @returns True if token is valid, false otherwise
 */
export function verifyTwoFactorToken(secret: string, token: string): boolean {
  try {
    const secretObj = OTPAuth.Secret.fromBase32(secret);
    const totp = new OTPAuth.TOTP({
      secret: secretObj,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });

    // Verify token with a window of ±1 period (30 seconds) for clock skew tolerance
    const delta = totp.validate({ token, window: [1, 1] });
    return delta !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Generates a backup code (8-digit numeric code)
 */
export function generateBackupCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * Generates multiple backup codes
 * @param count - Number of backup codes to generate (default: 10)
 */
export function generateBackupCodes(count: number = 10): string[] {
  return Array.from({ length: count }, () => generateBackupCode());
}
