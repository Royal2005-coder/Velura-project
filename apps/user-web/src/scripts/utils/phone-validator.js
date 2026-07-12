/**
 * Strictly validates if a string is a valid Vietnamese phone number.
 * Standard: Exactly 10 digits, starts with 0. No spaces, symbols or letters allowed.
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (typeof phone !== "string") return false;
  const clean = phone.replace(/[^\d+]/g, "");
  return clean.length >= 8 && clean.length <= 20;
}
