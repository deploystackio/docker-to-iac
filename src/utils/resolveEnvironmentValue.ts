export function resolveEnvironmentValue(
  value: string,
  environmentVariables?: Record<string, string>
): string {

  // Check if value uses ${VAR:-default} syntax
  const defaultValueMatch = value.match(/\${([^:-]+):-([^}]+)}/);
  
  if (defaultValueMatch) {
    const [, varName, defaultValue] = defaultValueMatch;
    
    // Check if the variable exists in provided environment variables
    if (environmentVariables && varName in environmentVariables) {
      return environmentVariables[varName];
    }
    
    // No environment variable found, use default
    return defaultValue;
  }

  return value;
}
