import { describe, test, expect, vi } from 'vitest';
import { getDigitalOceanDatabaseType } from '../../../src/utils/getDigitalOceanDatabaseType';
import { RegistryType } from '../../../src/parsers/base-parser';

// Mock dependencies
vi.mock('../../../src/utils/getImageUrl', () => ({
  getImageUrl: vi.fn((image) => {
    // Simplified mock that just returns the repository with docker.io/library/ prefix
    if (typeof image === 'string') {
      return `docker.io/library/${image.split(':')[0]}`;
    }
    return 'docker.io/library/unknown';
  })
}));

vi.mock('../../../src/utils/constructImageString', () => ({
  constructImageString: vi.fn((image) => {
    // Simple mock that just returns the repository and tag
    if (image.tag) {
      return `${image.repository}:${image.tag}`;
    }
    return image.repository;
  })
}));

vi.mock('../../../src/config/digitalocean/database-types', () => ({
  digitalOceanDatabaseConfig: {
    databases: {
      'docker.io/library/postgres': {
        engine: 'PG',
        description: 'PostgreSQL database service',
        portNumber: 5432,
        isManaged: true
      },
      'docker.io/library/mysql': {
        engine: 'MYSQL',
        description: 'MySQL database service',
        portNumber: 3306
      },
      'docker.io/library/redis': {
        engine: 'REDIS',
        description: 'Redis database service',
        portNumber: 6379
      },
      'docker.io/library/mongodb': {
        engine: 'MONGODB',
        description: 'MongoDB database service',
        portNumber: 27017
      }
    }
  }
}));

describe('getDigitalOceanDatabaseType', () => {
  test('should return PostgreSQL config for postgres image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres',
      tag: 'latest'
    };
    
    const result = getDigitalOceanDatabaseType(image);
    
    expect(result).toEqual({
      engine: 'PG',
      description: 'PostgreSQL database service',
      portNumber: 5432,
      isManaged: true
    });
  });

  test('should return MySQL config for mysql image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mysql',
      tag: '8.0'
    };
    
    const result = getDigitalOceanDatabaseType(image);
    
    expect(result).toEqual({
      engine: 'MYSQL',
      description: 'MySQL database service',
      portNumber: 3306
    });
  });

  test('should return Redis config for redis image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'redis',
      tag: 'alpine'
    };
    
    const result = getDigitalOceanDatabaseType(image);
    
    expect(result).toEqual({
      engine: 'REDIS',
      description: 'Redis database service',
      portNumber: 6379
    });
  });

  test('should return MongoDB config for mongodb image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mongodb',
      tag: 'latest'
    };
    
    const result = getDigitalOceanDatabaseType(image);
    
    expect(result).toEqual({
      engine: 'MONGODB',
      description: 'MongoDB database service',
      portNumber: 27017
    });
  });

  test('should return null for non-database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = getDigitalOceanDatabaseType(image);
    
    expect(result).toBeNull();
  });

  test('should return null for unknown database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'cassandra',
      tag: 'latest'
    };
    
    const result = getDigitalOceanDatabaseType(image);
    
    expect(result).toBeNull();
  });
});
