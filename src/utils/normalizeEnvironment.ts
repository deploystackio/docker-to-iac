import { resolveEnvironmentValue } from './resolveEnvironmentValue';

export interface EnvironmentConfig {
  [key: string]: string;
}

type EnvironmentInput = string[] | { [key: string]: string } | string | undefined;

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
      (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function splitOnFirstEquals(str: string): [string, string] {
  const firstEqualsIndex = str.indexOf('=');
  if (firstEqualsIndex === -1) {
    return [str, ''];
  }
  return [
    str.slice(0, firstEqualsIndex),
    str.slice(firstEqualsIndex + 1)
  ];
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
    const [key, value] = splitOnFirstEquals(env);
    return { [key.trim()]: stripQuotes(resolveEnvironmentValue(value, envVariables)) || '' };
  }

  // Handle array format
  if (Array.isArray(env)) {
    return env.reduce((acc: EnvironmentConfig, curr: string) => {
      const [key, value] = splitOnFirstEquals(curr);
      acc[key.trim()] = stripQuotes(resolveEnvironmentValue(value, envVariables)) || '';
      return acc;
    }, {});
  }

  // Handle object format
  if (typeof env === 'object') {
    return Object.entries(env).reduce((acc: EnvironmentConfig, [key, value]) => {
      const stringValue = value?.toString() || '';
      acc[key.trim()] = stripQuotes(resolveEnvironmentValue(stringValue, envVariables));
      return acc;
    }, {});
  }

  return {};
}
