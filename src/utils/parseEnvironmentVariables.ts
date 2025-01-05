import { resolveEnvironmentValue } from './resolveEnvironmentValue';

export function parseEnvironmentVariables(
  environment: Record<string, any> | string[] | undefined,
  environmentVariables?: Record<string, string>
): Record<string, string | number> {
  const environmentResult: Record<string, string | number> = {};
  
  if (!environment) {
    return environmentResult;
  }

  if (Array.isArray(environment)) {
    // Handle array format: ["KEY=value", "OTHER_KEY=othervalue"]
    environment.forEach(env => {
      if (typeof env === 'string' && env.includes('=')) {
        const [key, value] = env.split('=');
        environmentResult[key.trim()] = resolveEnvironmentValue(value.trim(), environmentVariables);
      }
    });
  } else {
    // Handle object format: { KEY: "value", OTHER_KEY: "othervalue" }
    Object.entries(environment).forEach(([key, value]) => {
      if (typeof value === 'string') {
        if (value.includes('=')) {
          const [splitKey, splitValue] = value.split('=');
          environmentResult[splitKey.trim()] = resolveEnvironmentValue(splitValue.trim(), environmentVariables);
        } else {
          environmentResult[key.trim()] = resolveEnvironmentValue(value, environmentVariables);
        }
      } else {
        environmentResult[key.trim()] = value?.toString() || '';
      }
    });
  }

  return environmentResult;
}
