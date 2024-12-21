export interface EnvironmentConfig {
  [key: string]: string;
}

type EnvironmentInput = string[] | { [key: string]: string } | string | undefined;

function substituteEnvVariables(value: string, envVariables?: Record<string, string>): string {
  if (!envVariables) return value;
  
  return value.replace(/\${([^}]+)}/g, (match, varName) => {
    return envVariables[varName] || match;
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
    const value = substituteEnvVariables(rawValue, envVariables);
    return { [key]: value || '' };
  }

  // Handle array format
  if (Array.isArray(env)) {
    return env.reduce((acc: EnvironmentConfig, curr: string) => {
      const [key, ...valueParts] = curr.split('=');
      const rawValue = valueParts.join('=');
      acc[key] = substituteEnvVariables(rawValue, envVariables) || '';
      return acc;
    }, {});
  }

  // Handle object format
  if (typeof env === 'object') {
    return Object.entries(env).reduce((acc: EnvironmentConfig, [key, value]) => {
      const stringValue = value?.toString() || '';
      acc[key] = substituteEnvVariables(stringValue, envVariables);
      return acc;
    }, {});
  }

  return {};
}