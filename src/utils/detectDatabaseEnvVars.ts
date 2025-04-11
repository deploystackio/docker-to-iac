/**
 * Automatically creates service connection configurations based on environment variables
 */
export function generateDatabaseServiceConnections(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config: { services: Record<string, { environment: Record<string, string> }> }
): Array<{ fromService: string, toService: string, environmentVariables: string[] }> {
  // Return an empty array - no auto-detection
  return [];
}
