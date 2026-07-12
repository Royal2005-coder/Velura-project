/**
 * Strictly validates if a string is a valid Vietnamese phone number.
 * Standard: Exactly 10 digits, starts with 0. No spaces, symbols or letters allowed.
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (typeof phone !== "string") return false;
  return /^0\d{9}$/.test(phone);
}
