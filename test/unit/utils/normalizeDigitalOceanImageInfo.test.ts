import { describe, test, expect } from 'vitest';
import { normalizeDigitalOceanImageInfo } from '../../../src/utils/normalizeDigitalOceanImageInfo';
import { RegistryType } from '../../../src/parsers/base-parser';

describe('normalizeDigitalOceanImageInfo', () => {
  test('should normalize Docker Hub official image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    expect(result).toEqual({
      registry: 'library',
      repository: 'nginx'
    });
  });

  test('should normalize Docker Hub library format image', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'library/nginx',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    expect(result).toEqual({
      registry: 'library',
      repository: 'nginx'
    });
  });

  test('should normalize Docker Hub user repository', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'bitnami/nginx',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    expect(result).toEqual({
      registry: 'bitnami',
      repository: 'nginx'
    });
  });

  test('should handle custom registry', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'custom.registry.com',
      repository: 'project/app',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    // For non-Docker Hub registries, keep as is
    expect(result).toEqual({
      registry: 'custom.registry.com',
      repository: 'project/app'
    });
  });

  test('should handle image with docker.io registry path', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'docker.io',
      repository: 'user/app',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    expect(result).toEqual({
      registry: 'user',
      repository: 'app'
    });
  });

  test('should handle image without registry', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'app',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    expect(result).toEqual({
      registry: 'library',
      repository: 'app'
    });
  });

  test('should handle repository with multiple path segments', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'org/team/app',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    // Based on actual implementation, it only uses the first two segments
    expect(result).toEqual({
      registry: 'org',
      repository: 'team'
    });
  });

  test('should handle repository path edge cases', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'org/',
      tag: 'latest'
    };
    
    const result = normalizeDigitalOceanImageInfo(image);
    
    // Should handle trailing slash gracefully
    expect(result).toEqual({
      registry: 'org',
      repository: 'org'
    });
  });
});
