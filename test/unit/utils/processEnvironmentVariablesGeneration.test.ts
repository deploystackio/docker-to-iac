import { describe, test, expect, vi } from 'vitest';
import { processEnvironmentVariablesGeneration } from '../../../src/utils/processEnvironmentVariablesGeneration';
import { RegistryType } from '../../../src/parsers/base-parser';

// Mock semver to control its behavior
vi.mock('semver', () => {
  return {
    default: {
      valid: vi.fn().mockReturnValue(true),
      coerce: vi.fn(version => version),
      satisfies: vi.fn().mockReturnValue(true),
      rcompare: vi.fn().mockImplementation((a, b) => a > b ? -1 : 1)
    },
    valid: vi.fn().mockReturnValue(true),
    coerce: vi.fn(version => version),
    satisfies: vi.fn().mockReturnValue(true),
    rcompare: vi.fn().mockImplementation((a, b) => a > b ? -1 : 1)
  };
});

describe('processEnvironmentVariablesGeneration', () => {
  test('should return original environment if no config provided', () => {
    const env = { VAR1: 'value1', VAR2: 'value2' };
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = processEnvironmentVariablesGeneration(env, image);
    
    expect(result).toEqual(env);
  });

  test('should return original environment if image not found in config', () => {
    const env = { VAR1: 'value1', VAR2: 'value2' };
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'nginx',
      tag: 'latest'
    };
    const config: any = {
      'postgresql': {
        versions: {
          '*': {
            environment: {
              POSTGRES_PASSWORD: { type: 'password' as const, length: 16 }
            }
          }
        }
      }
    };
    
    const result = processEnvironmentVariablesGeneration(env, image, config);
    
    expect(result).toEqual(env);
  });

  test('should generate environment variables based on configuration', () => {
    const env = { EXISTING: 'value' };
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'mariadb',
      tag: '10.5'
    };
    const config: any = {
      'mariadb': {
        versions: {
          '*': {
            environment: {
              MYSQL_ROOT_PASSWORD: { type: 'password' as const, length: 8 },
              MYSQL_DATABASE: { type: 'string' as const, length: 8 }
            }
          }
        }
      }
    };
    
    // Mock Math.random for predictable test outputs
    const mathRandomSpy = vi.spyOn(Math, 'random');
    mathRandomSpy.mockReturnValue(0.5);
    
    const result = processEnvironmentVariablesGeneration(env, image, config);
    
    expect(result).toHaveProperty('EXISTING', 'value');
    expect(result).toHaveProperty('MYSQL_ROOT_PASSWORD');
    expect(result).toHaveProperty('MYSQL_DATABASE');
    expect(result.MYSQL_ROOT_PASSWORD).toHaveLength(8);
    expect(result.MYSQL_DATABASE).toHaveLength(8);
    
    mathRandomSpy.mockRestore();
  });

  test('should match version-specific configuration', () => {
    const env = {};
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'postgres',
      tag: '13'
    };
    const config: any = {
      'postgres': {
        versions: {
          '13': {
            environment: {
              PG_VERSION_13: { type: 'string' as const, length: 8 }
            }
          },
          '12': {
            environment: {
              PG_VERSION_12: { type: 'string' as const, length: 8 }
            }
          }
        }
      }
    };
    
    const mathRandomSpy = vi.spyOn(Math, 'random');
    mathRandomSpy.mockReturnValue(0.5);
    
    const result = processEnvironmentVariablesGeneration(env, image, config);
    
    expect(result).toHaveProperty('PG_VERSION_13');
    expect(result).not.toHaveProperty('PG_VERSION_12');
    
    mathRandomSpy.mockRestore();
  });

  test('should try alternative repository formats', () => {
    const env = {};
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'nginx',
      tag: 'latest'
    };
    const config: any = {
      'docker.io/library/nginx': {
        versions: {
          '*': {
            environment: {
              NGINX_VAR: { type: 'string' as const, length: 8 }
            }
          }
        }
      }
    };
    
    const mathRandomSpy = vi.spyOn(Math, 'random');
    mathRandomSpy.mockReturnValue(0.5);
    
    const result = processEnvironmentVariablesGeneration(env, image, config);
    
    expect(result).toHaveProperty('NGINX_VAR');
    
    mathRandomSpy.mockRestore();
  });

  test('should handle wildcard version matching', () => {
    const env = {};
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'redis',
      tag: '6.2'
    };
    const config: any = {
      'redis': {
        versions: {
          '*': {
            environment: {
              REDIS_PASSWORD: { type: 'password' as const, length: 8 }
            }
          }
        }
      }
    };
    
    const mathRandomSpy = vi.spyOn(Math, 'random');
    mathRandomSpy.mockReturnValue(0.5);
    
    const result = processEnvironmentVariablesGeneration(env, image, config);
    
    expect(result).toHaveProperty('REDIS_PASSWORD');
    
    mathRandomSpy.mockRestore();
  });

  test('should handle numbers with min/max', () => {
    const env = {};
    const image = { 
      registry_type: RegistryType.DOCKER_HUB, 
      repository: 'app',
      tag: 'latest'
    };
    const config: any = {
      'app': {
        versions: {
          '*': {
            environment: {
              PORT: { type: 'number' as const, min: 3000, max: 5000 }
            }
          }
        }
      }
    };
    
    const mathRandomSpy = vi.spyOn(Math, 'random');
    mathRandomSpy.mockReturnValue(0.5);
    
    const result = processEnvironmentVariablesGeneration(env, image, config);
    
    expect(result).toHaveProperty('PORT');
    expect(parseInt(result.PORT)).toBeGreaterThanOrEqual(3000);
    expect(parseInt(result.PORT)).toBeLessThanOrEqual(5000);
    
    mathRandomSpy.mockRestore();
  });
});
