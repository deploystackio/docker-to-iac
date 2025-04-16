import { describe, test, expect, vi } from 'vitest';
import { isDigitalOceanManagedDatabase } from '../../../src/utils/isDigitalOceanManagedDatabase';
import { RegistryType } from '../../../src/parsers/base-parser';

// Mock dependencies
vi.mock('../../../src/utils/getImageUrl', () => ({
  getImageUrl: vi.fn((image) => {
    // Return predictable URLs based on the repository name
    if (typeof image === 'string') {
      const base = image.split(':')[0];
      if (base.includes('postgres')) return 'docker.io/library/postgres';
      if (base.includes('redis')) return 'docker.io/library/redis';
      if (base.includes('mysql')) return 'docker.io/library/mysql';
      if (base.includes('mariadb')) return 'docker.io/library/mariadb';
      if (base.includes('mongodb')) return 'docker.io/library/mongodb';
      return `docker.io/library/${base}`;
    }
    return 'docker.io/library/unknown';
  })
}));

vi.mock('../../../src/utils/constructImageString', () => ({
  constructImageString: vi.fn((image) => {
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
        portNumber: 6379,
        isManaged: true
      },
      'docker.io/library/mongodb': {
        engine: 'MONGODB',
        description: 'MongoDB database service',
        portNumber: 27017
      },
      'docker.io/library/mariadb': {
        engine: 'MYSQL',
        description: 'MariaDB database service',
        portNumber: 3306
      }
    }
  }
}));

describe('isDigitalOceanManagedDatabase', () => {
  test('should return true for postgres image (managed)', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres',
      tag: 'latest'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(true);
  });

  test('should return true for redis image (managed)', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'redis',
      tag: 'alpine'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(true);
  });

  test('should return false for mysql image (not managed)', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mysql',
      tag: '8.0'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(false);
  });

  test('should return false for mariadb image (not managed)', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mariadb',
      tag: 'latest'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(false);
  });

  test('should return false for mongodb image (not managed)', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mongodb',
      tag: 'latest'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(false);
  });

  test('should return false for non-database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(false);
  });

  test('should return false for unknown image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'custom-database',
      tag: 'latest'
    };
    
    const result = isDigitalOceanManagedDatabase(image);
    
    expect(result).toBe(false);
  });
});
