export function parseEnvironmentVariables(environment: Record<string, any> | string[] | undefined): Record<string, string | number> {
  const environmentVariables: Record<string, string | number> = {};
  
  if (!environment) {
    return environmentVariables;
  }

  if (Array.isArray(environment)) {
    // Handle array format: ["KEY=value", "OTHER_KEY=othervalue"]
    environment.forEach(env => {
      if (typeof env === 'string' && env.includes('=')) {
        const [key, value] = env.split('=');
        environmentVariables[key.trim()] = value.trim();
      }
    });
  } else {
    // Handle object format: { KEY: "value", OTHER_KEY: "othervalue" }
    Object.entries(environment).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('=')) {
        const [splitKey, splitValue] = value.split('=');
        environmentVariables[splitKey.trim()] = splitValue.trim();
      } else {
        environmentVariables[key.trim()] = value?.toString() || '';
      }
    });
  }

  return environmentVariables;
}
