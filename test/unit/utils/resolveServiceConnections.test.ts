import { describe, test, expect } from 'vitest';
import { resolveServiceConnections } from '../../../src/utils/resolveServiceConnections';
import { ApplicationConfig } from '../../../src/types/container-config';
import { ServiceConnectionsConfig } from '../../../src/types/service-connections';
import { RegistryType } from '../../../src/parsers/base-parser';

describe('resolveServiceConnections', () => {
  test('should resolve simple service connections', () => {
    // Create a simple application config with two services
    const config: ApplicationConfig = {
      services: {
        'web': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'nginx'
          },
          ports: [],
          volumes: [],
          environment: {
            'DATABASE_URL': 'postgres://localhost:5432/db'
          }
        },
        'db': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'postgres'
          },
          ports: [],
          volumes: [],
          environment: {}
        }
      }
    };

    // Create service connections config
    const serviceConnections: ServiceConnectionsConfig = {
      mappings: [
        {
          fromService: 'web',
          toService: 'db',
          environmentVariables: ['DATABASE_URL']
        }
      ]
    };

    // Resolve connections
    const result = resolveServiceConnections(config, serviceConnections);

    // Verify the result
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      fromService: 'web',
      toService: 'db',
      property: 'hostport', // Default property
      variables: {
        'DATABASE_URL': {
          originalValue: 'postgres://localhost:5432/db',
          transformedValue: 'postgres://localhost:5432/db' // Initially the same
        }
      }
    });
  });

  test('should use custom property if specified', () => {
    const config: ApplicationConfig = {
      services: {
        'web': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'nginx'
          },
          ports: [],
          volumes: [],
          environment: {
            'DATABASE_URL': 'postgres://localhost:5432/db'
          }
        },
        'db': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'postgres'
          },
          ports: [],
          volumes: [],
          environment: {}
        }
      }
    };

    const serviceConnections: ServiceConnectionsConfig = {
      mappings: [
        {
          fromService: 'web',
          toService: 'db',
          environmentVariables: ['DATABASE_URL'],
          property: 'connectionString'
        }
      ]
    };

    const result = resolveServiceConnections(config, serviceConnections);

    expect(result).toHaveLength(1);
    expect(result[0].property).toBe('connectionString');
  });

  test('should match partial environment variable names', () => {
    const config: ApplicationConfig = {
      services: {
        'app': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'app'
          },
          ports: [],
          volumes: [],
          environment: {
            'REDIS_URL': 'redis://localhost:6379',
            'REDIS_PASSWORD': 'secret'
          }
        },
        'redis': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'redis'
          },
          ports: [],
          volumes: [],
          environment: {}
        }
      }
    };

    const serviceConnections: ServiceConnectionsConfig = {
      mappings: [
        {
          fromService: 'app',
          toService: 'redis',
          environmentVariables: ['REDIS']
        }
      ]
    };

    const result = resolveServiceConnections(config, serviceConnections);

    expect(result).toHaveLength(1);
    expect(Object.keys(result[0].variables)).toHaveLength(2);
    expect(result[0].variables).toHaveProperty('REDIS_URL');
    expect(result[0].variables).toHaveProperty('REDIS_PASSWORD');
  });

  test('should skip connections with missing services', () => {
    const config: ApplicationConfig = {
      services: {
        'web': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'nginx'
          },
          ports: [],
          volumes: [],
          environment: {
            'DATABASE_URL': 'postgres://localhost:5432/db'
          }
        }
      }
    };

    const serviceConnections: ServiceConnectionsConfig = {
      mappings: [
        {
          fromService: 'web',
          toService: 'db', // This service doesn't exist
          environmentVariables: ['DATABASE_URL']
        }
      ]
    };

    const result = resolveServiceConnections(config, serviceConnections);

    // Should return empty array or warn and skip
    expect(result).toHaveLength(0);
  });

  test('should handle multiple mappings', () => {
    const config: ApplicationConfig = {
      services: {
        'web': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'nginx'
          },
          ports: [],
          volumes: [],
          environment: {
            'DATABASE_URL': 'postgres://localhost:5432/db',
            'REDIS_URL': 'redis://localhost:6379'
          }
        },
        'db': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'postgres'
          },
          ports: [],
          volumes: [],
          environment: {}
        },
        'cache': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'redis'
          },
          ports: [],
          volumes: [],
          environment: {}
        }
      }
    };

    const serviceConnections: ServiceConnectionsConfig = {
      mappings: [
        {
          fromService: 'web',
          toService: 'db',
          environmentVariables: ['DATABASE_URL']
        },
        {
          fromService: 'web',
          toService: 'cache',
          environmentVariables: ['REDIS_URL']
        }
      ]
    };

    const result = resolveServiceConnections(config, serviceConnections);

    expect(result).toHaveLength(2);
    expect(result[0].toService).toBe('db');
    expect(result[0].variables).toHaveProperty('DATABASE_URL');
    expect(result[1].toService).toBe('cache');
    expect(result[1].variables).toHaveProperty('REDIS_URL');
  });

  test('should handle case with no matching environment variables', () => {
    const config: ApplicationConfig = {
      services: {
        'web': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'nginx'
          },
          ports: [],
          volumes: [],
          environment: {
            'SERVER_PORT': '8080'
          }
        },
        'db': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'postgres'
          },
          ports: [],
          volumes: [],
          environment: {}
        }
      }
    };

    const serviceConnections: ServiceConnectionsConfig = {
      mappings: [
        {
          fromService: 'web',
          toService: 'db',
          environmentVariables: ['DATABASE_URL'] // Not in environment
        }
      ]
    };

    const result = resolveServiceConnections(config, serviceConnections);

    expect(result).toHaveLength(1);
    expect(Object.keys(result[0].variables)).toHaveLength(0); // No variables matched
  });
});
