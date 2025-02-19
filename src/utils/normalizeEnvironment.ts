export interface EnvironmentConfig {
  [key: string]: string;
}

type EnvironmentInput = string[] | { [key: string]: string } | string | undefined;

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function substituteEnvVariables(value: string, envVariables?: Record<string, string>): string {
  if (!envVariables) return value;
  
  return value.replace(/\${([^}]+)}/g, (match, p1) => {
    // Check if this is a variable with default value
    const defaultMatch = p1.match(/([^:-]+):-(.+)/);
    
    if (defaultMatch) {
      const [, varName, defaultValue] = defaultMatch;
      return stripQuotes(envVariables[varName] || defaultValue);
    }
    
    // Regular variable without default
    return stripQuotes(envVariables[p1] || match);
  });
}

export function normalizeEnvironment(
  env: EnvironmentInput,
  envVariables?: Record<string, string>
): EnvironmentConfig {
  if (!env) {
    return {};
  }

  // Handle string format (single env var)
  if (typeof env === 'string') {
    const [key, ...valueParts] = env.split('=');
    const rawValue = valueParts.join('=');
    const value = stripQuotes(substituteEnvVariables(rawValue, envVariables));
    return { [key.trim()]: value || '' };
  }

  // Handle array format
  if (Array.isArray(env)) {
    return env.reduce((acc: EnvironmentConfig, curr: string) => {
      const [key, ...valueParts] = curr.split('=');
      const rawValue = valueParts.join('=');
      acc[key.trim()] = stripQuotes(substituteEnvVariables(rawValue, envVariables)) || '';
      return acc;
    }, {});
  }

  // Handle object format
  if (typeof env === 'object') {
    return Object.entries(env).reduce((acc: EnvironmentConfig, [key, value]) => {
      const stringValue = value?.toString() || '';
      acc[key.trim()] = stripQuotes(substituteEnvVariables(stringValue, envVariables));
      return acc;
    }, {});
  }

  return {};
}
