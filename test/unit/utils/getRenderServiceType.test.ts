import { describe, test, expect, vi } from 'vitest';
import { getRenderServiceType } from '../../../src/utils/getRenderServiceType';
import { RegistryType } from '../../../src/parsers/base-parser';

// Mock dependencies
vi.mock('../../../src/utils/getImageUrl', () => ({
  getImageUrl: vi.fn((image) => {
    // Simplified mock that returns a standardized URL format
    if (typeof image === 'string') {
      return `docker.io/library/${image.split(':')[0]}`;
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

vi.mock('../../../src/config/render/service-types', () => ({
  renderServiceTypesConfig: {
    serviceTypes: {
      'docker.io/library/postgres': {
        type: 'database',
        description: 'PostgreSQL database',
        versions: '*',
        isManaged: true
      },
      'docker.io/library/mysql': {
        type: 'pserv', 
        description: 'MySQL service',
        versions: '*'
      },
      'docker.io/library/redis': {
        type: 'redis',
        description: 'Redis service',
        versions: '*',
        isManaged: true
      },
      'docker.io/library/mariadb': {
        type: 'pserv',
        description: 'MariaDB service',
        versions: '*'
      }
    }
  }
}));

describe('getRenderServiceType', () => {
  test('should return database type for postgres image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres',
      tag: 'latest'
    };
    
    const result = getRenderServiceType(image);
    
    expect(result).toBe('database');
  });

  test('should return pserv type for mysql image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mysql',
      tag: '8.0'
    };
    
    const result = getRenderServiceType(image);
    
    expect(result).toBe('pserv');
  });

  test('should return redis type for redis image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'redis',
      tag: 'alpine'
    };
    
    const result = getRenderServiceType(image);
    
    expect(result).toBe('redis');
  });

  test('should return pserv type for mariadb image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mariadb',
      tag: 'latest'
    };
    
    const result = getRenderServiceType(image);
    
    expect(result).toBe('pserv');
  });

  test('should return web type (default) for unknown image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = getRenderServiceType(image);
    
    expect(result).toBe('web');
  });

  test('should return web type for custom registry image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'registry.example.com',
      repository: 'app',
      tag: 'latest'
    };
    
    const result = getRenderServiceType(image);
    
    expect(result).toBe('web');
  });
});
