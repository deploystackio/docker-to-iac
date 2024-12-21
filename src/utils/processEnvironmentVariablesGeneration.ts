import { DockerImageInfo } from '../parsers/base-parser';
import { EnvironmentVariableGenerationConfig, EnvVarGenerationType } from '../types/environment-config';
import semver from 'semver';

function generateValue(config: EnvVarGenerationType): string {
  switch (config.type) {
    case 'password':
      return generatePassword(config.length || 16, config.pattern);
    case 'string':
      return generateString(config.length || 8, config.pattern);
    case 'number':
      return generateNumber(config.min, config.max).toString();
    default:
      throw new Error(`Unsupported generation type: ${config.type}`);
  }
}

function generatePassword(length: number, pattern?: string): string {
  const charset = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*'
  };

  if (pattern) {
    // TODO: Implement custom pattern matching
    return generateString(length, pattern);
  }

  // Default strong password pattern
  const allChars = charset.uppercase + charset.lowercase + charset.numbers + charset.special;
  let password = '';
  
  // Ensure at least one of each type
  password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
  password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
  password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
  password += charset.special[Math.floor(Math.random() * charset.special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

function generateString(length: number, pattern: string = 'default'): string {
  const charsets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  };

  const selectedCharset = charsets[pattern as keyof typeof charsets] || charsets.default;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += selectedCharset[Math.floor(Math.random() * selectedCharset.length)];
  }
  
  return result;
}

function generateNumber(min?: number, max?: number): number {
  min = min ?? 1;
  max = max ?? 1000000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findMatchingVersion(versions: string[], targetVersion: string | undefined): string | null {
  // Handle undefined or 'latest' tag
  if (!targetVersion || targetVersion === 'latest') {
    // Find version that matches '*' or 'latest' first
    const wildcardVersion = versions.find(v => v === '*' || v === 'latest');
    if (wildcardVersion) {
      return wildcardVersion;
    }

    // If no wildcard/latest version specified, take the highest version number
    const numericVersions = versions.filter(v => semver.valid(semver.coerce(v)));
    if (numericVersions.length > 0) {
      return numericVersions.sort((a, b) => 
        semver.rcompare(semver.coerce(a) || '0.0.0', semver.coerce(b) || '0.0.0')
      )[0];
    }
    
    return null;
  }

  // For specific versions, continue with existing logic
  const sortedVersions = versions.sort((a, b) => 
    semver.rcompare(semver.coerce(a) || '0.0.0', semver.coerce(b) || '0.0.0')
  );
  
  for (const version of sortedVersions) {
    // Handle '*' or 'latest' in version spec
    if (version === '*' || version === 'latest') {
      return version;
    }
    
    try {
      if (semver.satisfies(semver.coerce(targetVersion) || '0.0.0', version)) {
        return version;
      }
    } catch (e) {
      console.warn(`Invalid semver range: ${version} - ${e}`);
      continue;
    }
  }
  
  return null;
}

export function processEnvironmentVariablesGeneration(
  environment: { [key: string]: string },
  image: DockerImageInfo,
  config?: EnvironmentVariableGenerationConfig
): { [key: string]: string } {
  if (!config) {
    return environment;
  }

  const result = { ...environment };
  const imageConfig = config[image.repository];

  if (!imageConfig) {
    return result;
  }

  const versions = Object.keys(imageConfig.versions);
  const matchingVersion = findMatchingVersion(versions, image.tag || 'latest');

  if (!matchingVersion) {
    return result;
  }

  const versionConfig = imageConfig.versions[matchingVersion];

  // Process each environment variable
  for (const [key, value] of Object.entries(result)) {
    if (versionConfig.environment[key]) {
      // If the value starts with ${ and ends with }, generate a new value
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        result[key] = generateValue(versionConfig.environment[key]);
      }
    }
  }

  return result;
}
