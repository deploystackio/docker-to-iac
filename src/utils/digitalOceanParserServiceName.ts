/**
 * Formats service names to match DigitalOcean's requirements:
 * - Must start with a lowercase letter
 * - Can only contain lowercase letters, numbers, and hyphens
 * - Must be between 2-32 characters
 * - Must end with a letter or number
 * - Must match regex: ^[a-z][a-z0-9-]{0,30}[a-z0-9]$
 *
 * @param input - String, array of strings, or undefined to parse
 * @returns Formatted string meeting DigitalOcean's requirements
 */
export function digitalOceanParserServiceName(input: string | string[] | undefined): string {
  if (!input) {
    return 'service';
  }

  // Convert array to string if needed
  const rawString = Array.isArray(input) ? input.join('-') : input.toString();

  // Convert to lowercase and replace underscores with hyphens
  let formatted = rawString.toLowerCase().replace(/_/g, '-');

  // Remove any characters that aren't lowercase letters, numbers, or hyphens
  formatted = formatted.replace(/[^a-z0-9-]/g, '');

  // Ensure starts with letter
  if (!/^[a-z]/.test(formatted)) {
    formatted = 'svc-' + formatted;
  }

  // Remove consecutive hyphens
  formatted = formatted.replace(/-+/g, '-');

  // Remove trailing hyphen and ensure ends with alphanumeric
  formatted = formatted.replace(/-+$/, '');
  if (!/[a-z0-9]$/.test(formatted)) {
    formatted += '0';
  }

  // Truncate to 32 chars if needed
  if (formatted.length > 32) {
    formatted = formatted.slice(0, 32);
    // After truncating, ensure it still ends with alphanumeric
    if (!/[a-z0-9]$/.test(formatted)) {
      formatted = formatted.slice(0, -1) + '0';
    }
  }

  // If result is too short, pad with service number
  if (formatted.length < 2) {
    formatted = 'service-1';
  }

  return formatted;
}
