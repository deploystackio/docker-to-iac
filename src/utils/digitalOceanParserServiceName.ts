/**
 * Parses and sanitizes input into a valid string format.
 * The output string:
 * - Has maximum length of 32 characters
 * - Only allows alphanumeric characters plus underscore and hyphen
 * - Cannot start or end with special characters
 *
 * @param input - String, array of strings, or undefined to parse
 * @returns Sanitized string meeting all requirements
 */
export function digitalOceanParserServiceName(input: string | string[] | undefined): string {

  if (!input) {
    return '';
  }

  // Convert array to string if needed
  const rawString = Array.isArray(input) ? input.join(' ') : input.toString();

  // Remove all special characters except underscore and hyphen
  let sanitized = rawString.replace(/[^a-zA-Z0-9_-]/g, '');

  // Remove leading special characters
  sanitized = sanitized.replace(/^[_-]+/, '');

  // Remove trailing special characters
  sanitized = sanitized.replace(/[_-]+$/, '');

  return sanitized.slice(0, 32);
}
