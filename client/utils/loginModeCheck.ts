type LoginMode = "email" | "phone" | "invalid";

/**
 * Determines whether the given input is an email or a phone number.
 * @param data - The user input string (email or phone number)
 * @returns 'email' if it matches an email pattern,
 *          'phone' if it matches a phone pattern,
 *          'invalid' otherwise
 */
const LoginModeCheck = (data: string): LoginMode => {
  if (!data || data.trim() === "") {
    return "invalid";
  }

  const trimmed = data.trim();

  // Basic email regex: something@something.something
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return "email";
  }

  // Phone regex: allows digits, spaces, hyphens, parentheses, and optional leading +
  // Requires at least 7 digits (common minimum for international phone numbers)
  const phoneRegex = /^[+]?[\d\s()-]{7,}$/;
  // Additional check to ensure it contains at least one digit
  const hasDigit = /\d/.test(trimmed);
  if (phoneRegex.test(trimmed) && hasDigit) {
    return "phone";
  }

  return "invalid";
};

export default LoginModeCheck;
