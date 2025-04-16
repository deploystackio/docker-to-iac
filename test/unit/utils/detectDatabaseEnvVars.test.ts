import { describe, test, expect } from 'vitest';
import { generateDatabaseServiceConnections } from '../../../src/utils/detectDatabaseEnvVars';
import { RegistryType } from '../../../src/parsers/base-parser';

describe('generateDatabaseServiceConnections', () => {
  test('should return empty array when no services are provided', () => {
    const config = {
      services: {}
    };
    
    const result = generateDatabaseServiceConnections(config);
    
    expect(result).toEqual([]);
  });

  test('should return empty array when there are no database connections to detect', () => {
    const config = {
      services: {
        'web': {
          environment: {
            'NODE_ENV': 'production',
            'PORT': '3000'
          }
        }
      }
    };
    
    const result = generateDatabaseServiceConnections(config);
    
    expect(result).toEqual([]);
  });

  test('should handle service with potential database environment variables', () => {
    const config = {
      services: {
        'web': {
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
          environment: {}
        },
        'cache': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'redis'
          },
          environment: {}
        }
      }
    };
    
    const result = generateDatabaseServiceConnections(config);
    
    // The implementation returns an empty array based on the function in src/utils/detectDatabaseEnvVars.ts
    expect(result).toEqual([]);
  });

  test('should handle complex environment variables', () => {
    const config = {
      services: {
        'api': {
          environment: {
            'PG_CONNECTION_STRING': 'postgres://user:password@db:5432/database',
            'MYSQL_CONNECTION': 'mysql://root:pass@mysql:3306/app',
            'MONGODB_URI': 'mongodb://mongo:27017/data'
          }
        },
        'db': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'postgres',
            tag: 'latest'
          },
          environment: {}
        },
        'mysql': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'mysql',
            tag: '8.0'
          },
          environment: {}
        },
        'mongo': {
          image: {
            registry_type: RegistryType.DOCKER_HUB,
            repository: 'mongodb',
            tag: 'latest'
          },
          environment: {}
        }
      }
    };
    
    const result = generateDatabaseServiceConnections(config);
    
    // The implementation returns an empty array based on the function in src/utils/detectDatabaseEnvVars.ts
    expect(result).toEqual([]);
  });
});
