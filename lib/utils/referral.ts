export function generateReferralCode(baseCustomerId: string): string {
  // Generate a short, URL-friendly referral code
  // Format: REF- + first 8 chars of UUID + 4 random alphanumeric
  const uuid = baseCustomerId.slice(0, 8).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${uuid}${random}`;
}

export function isValidReferralCode(code: string): boolean {
  // Validate referral code format (8 alphanumeric chars)
  return /^[A-Z0-9]{8}$/.test(code);
}
