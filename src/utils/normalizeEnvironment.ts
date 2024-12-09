export interface EnvironmentConfig {
  [key: string]: string;
}

type EnvironmentInput = string[] | { [key: string]: string } | string | undefined;

export function normalizeEnvironment(env: EnvironmentInput): EnvironmentConfig {
  if (!env) {
    return {};
  }

  // Handle string format (single env var), e.g. "KEY=value"
  if (typeof env === 'string') {
    const [key, ...valueParts] = env.split('=');
    const value = valueParts.join('='); // Handle values that might contain '='
    return { [key]: value || '' };
  }

  // Handle array format, e.g. ["KEY1=value1", "KEY2=value2"]
  if (Array.isArray(env)) {
    return env.reduce((acc: EnvironmentConfig, curr: string) => {
      const [key, ...valueParts] = curr.split('=');
      acc[key] = valueParts.join('=') || '';
      return acc;
    }, {});
  }

  // Handle object format, e.g. { KEY1: "value1", KEY2: "value2" }
  if (typeof env === 'object') {
    return Object.entries(env).reduce((acc: EnvironmentConfig, [key, value]) => {
      acc[key] = value?.toString() || '';
      return acc;
    }, {});
  }

  return {};
}