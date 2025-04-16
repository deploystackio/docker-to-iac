import { describe, test, expect } from 'vitest';
import { parseDockerImage } from '../../../src/utils/parseDockerImage';
import { RegistryType } from '../../../src/parsers/base-parser';

describe('parseDockerImage', () => {
  test('should parse simple Docker Hub image', () => {
    const result = parseDockerImage('nginx');
    
    expect(result).toEqual({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    });
  });

  test('should parse Docker Hub image with tag', () => {
    const result = parseDockerImage('nginx:1.21');
    
    expect(result).toEqual({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: '1.21'
    });
  });

  test('should parse Docker Hub image with organization', () => {
    const result = parseDockerImage('bitnami/nginx:latest');
    
    expect(result).toEqual({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'bitnami/nginx',
      tag: 'latest'
    });
  });

  test('should parse GitHub Container Registry image', () => {
    const result = parseDockerImage('ghcr.io/dagu-org/dagu:latest');
    
    expect(result).toEqual({
      registry_type: RegistryType.GHCR,
      registry: 'ghcr.io',
      repository: 'dagu-org/dagu',
      tag: 'latest'
    });
  });

  test('should parse custom registry image', () => {
    const result = parseDockerImage('registry.example.com/project/image:tag');
    
    expect(result).toEqual({
      registry_type: RegistryType.DOCKER_HUB,
      registry: 'registry.example.com',
      repository: 'project/image',
      tag: 'tag'
    });
  });

  test('should parse image with digest', () => {
    const result = parseDockerImage('nginx@sha256:abcdef123456');
    
    expect(result).toEqual({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      digest: 'sha256:abcdef123456'
    });
  });

  test('should throw error for empty string', () => {
    expect(() => parseDockerImage('')).toThrow('Docker image string cannot be empty');
  });

  test('should throw error for non-string input', () => {
    expect(() => parseDockerImage(null as any)).toThrow('Docker image must be a string');
    expect(() => parseDockerImage(undefined as any)).toThrow('Docker image must be a string');
    expect(() => parseDockerImage({} as any)).toThrow('Docker image must be a string');
  });
});
