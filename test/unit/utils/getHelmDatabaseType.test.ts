import { describe, test, expect, vi } from 'vitest';
import { getHelmDatabaseType, isHelmManagedDatabase } from '../../../src/utils/getHelmDatabaseType';
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

vi.mock('../../../src/config/helm/database-types', () => ({
  helmDatabaseConfig: {
    databases: {
      'docker.io/library/postgres': {
        name: 'postgresql',
        version: '12.1.3',
        repository: 'https://charts.bitnami.com/bitnami',
        valueTemplate: {
          auth: {
            username: 'postgres',
            password: 'postgres',
            database: 'postgres'
          }
        }
      },
      'docker.io/library/mysql': {
        name: 'mysql',
        version: '9.4.5',
        repository: 'https://charts.bitnami.com/bitnami',
        valueTemplate: {
          auth: {
            rootPassword: 'mysql',
            database: 'mysql'
          }
        }
      },
      'docker.io/library/redis': {
        name: 'redis',
        version: '17.11.3',
        repository: 'https://charts.bitnami.com/bitnami',
        valueTemplate: {
          auth: {
            password: 'redis'
          }
        }
      },
      'docker.io/library/mongodb': {
        name: 'mongodb',
        version: '13.9.1',
        repository: 'https://charts.bitnami.com/bitnami',
        valueTemplate: {
          auth: {
            rootPassword: 'mongodb',
            database: 'mongodb'
          }
        }
      }
    }
  }
}));

describe('getHelmDatabaseType', () => {
  test('should return PostgreSQL config for postgres image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres',
      tag: 'latest'
    };
    
    const result = getHelmDatabaseType(image);
    
    expect(result).toEqual({
      name: 'postgresql',
      version: '12.1.3',
      repository: 'https://charts.bitnami.com/bitnami',
      valueTemplate: {
        auth: {
          username: 'postgres',
          password: 'postgres',
          database: 'postgres'
        }
      }
    });
  });

  test('should return MySQL config for mysql image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mysql',
      tag: '8.0'
    };
    
    const result = getHelmDatabaseType(image);
    
    expect(result).toEqual({
      name: 'mysql',
      version: '9.4.5',
      repository: 'https://charts.bitnami.com/bitnami',
      valueTemplate: {
        auth: {
          rootPassword: 'mysql',
          database: 'mysql'
        }
      }
    });
  });

  test('should return Redis config for redis image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'redis',
      tag: 'alpine'
    };
    
    const result = getHelmDatabaseType(image);
    
    expect(result).toEqual({
      name: 'redis',
      version: '17.11.3',
      repository: 'https://charts.bitnami.com/bitnami',
      valueTemplate: {
        auth: {
          password: 'redis'
        }
      }
    });
  });

  test('should return MongoDB config for mongodb image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mongodb',
      tag: 'latest'
    };
    
    const result = getHelmDatabaseType(image);
    
    expect(result).toEqual({
      name: 'mongodb',
      version: '13.9.1',
      repository: 'https://charts.bitnami.com/bitnami',
      valueTemplate: {
        auth: {
          rootPassword: 'mongodb',
          database: 'mongodb'
        }
      }
    });
  });

  test('should return null for non-database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = getHelmDatabaseType(image);
    
    expect(result).toBeNull();
  });

  test('should return null for unknown database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'cassandra',
      tag: 'latest'
    };
    
    const result = getHelmDatabaseType(image);
    
    expect(result).toBeNull();
  });
});

describe('isHelmManagedDatabase', () => {
  test('should return true for PostgreSQL image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres',
      tag: 'latest'
    };
    
    const result = isHelmManagedDatabase(image);
    
    expect(result).toBe(true);
  });

  test('should return true for MySQL image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mysql',
      tag: '8.0'
    };
    
    const result = isHelmManagedDatabase(image);
    
    expect(result).toBe(true);
  });

  test('should return false for non-database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = isHelmManagedDatabase(image);
    
    expect(result).toBe(false);
  });

  test('should return false for unknown database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'cassandra',
      tag: 'latest'
    };
    
    const result = isHelmManagedDatabase(image);
    
    expect(result).toBe(false);
  });

  test('should handle image without tag', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres'
    };
    
    const result = isHelmManagedDatabase(image);
    
    expect(result).toBe(true);
  });

  test('should handle image with registry', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'docker.io',
      repository: 'mysql',
      tag: 'latest'
    };
    
    const result = isHelmManagedDatabase(image);
    
    expect(result).toBe(true);
  });
});
