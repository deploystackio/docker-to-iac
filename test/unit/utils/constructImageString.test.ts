import { describe, test, expect } from 'vitest';
import { constructImageString } from '../../../src/utils/constructImageString';
import { RegistryType } from '../../../src/parsers/base-parser';

describe('constructImageString', () => {
  test('should construct basic image string', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('nginx');
  });

  test('should include tag if provided', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'alpine'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('nginx:alpine');
  });

  test('should include registry if provided', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'docker.io',
      repository: 'nginx'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('docker.io/nginx');
  });

  test('should handle GitHub Container Registry', () => {
    const image = {
      registry_type: RegistryType.GHCR,
      registry: 'ghcr.io',
      repository: 'owner/repo',
      tag: 'latest'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('ghcr.io/owner/repo:latest');
  });

  test('should handle custom registry', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'registry.example.com',
      repository: 'project/app',
      tag: 'v1.0'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('registry.example.com/project/app:v1.0');
  });

  test('should handle image with digest', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      digest: 'sha256:abcdef123456'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('nginx@sha256:abcdef123456');
  });

  test('should handle image with both tag and digest (digest takes precedence)', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest',
      digest: 'sha256:abcdef123456'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('nginx:latest@sha256:abcdef123456');
  });

  test('should handle complex image with registry, repository, tag, and digest', () => {
    const image = {
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'registry.example.com',
      repository: 'project/app',
      tag: 'v1.0',
      digest: 'sha256:abcdef123456'
    };
    
    const result = constructImageString(image);
    expect(result).toBe('registry.example.com/project/app:v1.0@sha256:abcdef123456');
  });
});
