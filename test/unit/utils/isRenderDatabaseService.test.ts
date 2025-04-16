import { describe, test, expect, vi } from 'vitest';
import { isRenderDatabaseService } from '../../../src/utils/isRenderDatabaseService';
import { RegistryType } from '../../../src/parsers/base-parser';

// First, import the module we'll be mocking
import * as getImageUrlModule from '../../../src/utils/getImageUrl';

// Mock dependencies
vi.mock('../../../src/utils/getImageUrl', () => ({
  getImageUrl: vi.fn((image) => {
    // Simple mock implementation that returns predictable URLs
    if (typeof image === 'string') {
      if (image.includes('postgres')) return 'docker.io/library/postgres';
      if (image.includes('redis')) return 'docker.io/library/redis';
      if (image.includes('mysql')) return 'docker.io/library/mysql';
      if (image.includes('mariadb')) return 'docker.io/library/mariadb';
      return `docker.io/library/${image.split(':')[0]}`;
    }
    // For DockerImageInfo objects
    const repo = typeof image === 'object' && image?.repository;
    if (repo && typeof repo === 'string') {
      if (repo.includes('postgres')) return 'docker.io/library/postgres';
      if (repo.includes('redis')) return 'docker.io/library/redis';
      if (repo.includes('mysql')) return 'docker.io/library/mysql';
      if (repo.includes('mariadb')) return 'docker.io/library/mariadb';
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
      'docker.io/library/redis': {
        type: 'redis',
        description: 'Redis database',
        versions: '*',
        isManaged: true
      },
      'docker.io/library/mysql': {
        type: 'pserv',
        description: 'MySQL database service',
        versions: '*'
      },
      'docker.io/library/mariadb': {
        type: 'pserv',
        description: 'MariaDB database service',
        versions: '*'
      }
    }
  }
}));

describe('isRenderDatabaseService', () => {
  test('should return true for postgres image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'postgres',
      tag: 'latest'
    };
    
    const result = isRenderDatabaseService(image);
    
    expect(result).toBe(true);
  });

  test('should return true for redis image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'redis',
      tag: 'alpine'
    };
    
    const result = isRenderDatabaseService(image);
    
    expect(result).toBe(true);
  });

  test('should return false for mysql image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mysql',
      tag: '8.0'
    };
    
    const result = isRenderDatabaseService(image);
    
    expect(result).toBe(false);
  });

  test('should return false for mariadb image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'mariadb',
      tag: 'latest'
    };
    
    const result = isRenderDatabaseService(image);
    
    expect(result).toBe(false);
  });

  test('should return false for non-database image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = isRenderDatabaseService(image);
    
    expect(result).toBe(false);
  });

  test('should handle custom images containing postgres in name', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'bitnami/postgresql',
      tag: 'latest'
    };
    
    // Override the mock for this specific test
    const mockGetImageUrl = vi.mocked(getImageUrlModule.getImageUrl);
    mockGetImageUrl.mockReturnValueOnce('docker.io/bitnami/postgresql');
    
    const result = isRenderDatabaseService(image);
    
    // Implementation checks if name includes postgres
    expect(result).toBe(true);
  });

  test('should handle custom images containing redis in name', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'bitnami/redis',
      tag: 'latest'
    };
    
    // Override the mock for this specific test
    const mockGetImageUrl = vi.mocked(getImageUrlModule.getImageUrl);
    mockGetImageUrl.mockReturnValueOnce('docker.io/bitnami/redis');
    
    const result = isRenderDatabaseService(image);
    
    // Implementation checks if name includes redis
    expect(result).toBe(true);
  });
});
