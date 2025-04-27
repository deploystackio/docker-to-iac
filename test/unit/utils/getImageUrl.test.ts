import { describe, test, expect, vi } from 'vitest';
import { getImageUrl } from '../../../src/utils/getImageUrl';
import { parseDockerImage } from '../../../src/utils/parseDockerImage';
import { RegistryType } from '../../../src/parsers/base-parser';

// Mock parseDockerImage to control its output
vi.mock('../../../src/utils/parseDockerImage', () => ({
  parseDockerImage: vi.fn()
}));

describe('getImageUrl', () => {
  test('should format Docker Hub official image', () => {
    // Mock the implementation for this test
    (parseDockerImage as any).mockReturnValue({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    });

    const result = getImageUrl('nginx:latest');
    
    expect(result).toBe('docker.io/library/nginx:latest');
    expect(parseDockerImage).toHaveBeenCalledWith('nginx:latest');
  });

  test('should format Docker Hub user image', () => {
    (parseDockerImage as any).mockReturnValue({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'user/nginx',
      tag: 'latest'
    });

    const result = getImageUrl('user/nginx:latest');
    
    expect(result).toBe('docker.io/user/nginx:latest');
    expect(parseDockerImage).toHaveBeenCalledWith('user/nginx:latest');
  });

  test('should format GitHub Container Registry image', () => {
    (parseDockerImage as any).mockReturnValue({
      registry_type: RegistryType.GHCR,
      repository: 'user/app',
      tag: 'v1.0'
    });

    const result = getImageUrl('ghcr.io/user/app:v1.0');
    
    expect(result).toBe('ghcr.io/user/app:v1.0');
    expect(parseDockerImage).toHaveBeenCalledWith('ghcr.io/user/app:v1.0');
  });

  test('should handle images without tags', () => {
    (parseDockerImage as any).mockReturnValue({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'redis'
    });

    const result = getImageUrl('redis');
    
    expect(result).toBe('docker.io/library/redis');
    expect(parseDockerImage).toHaveBeenCalledWith('redis');
  });

  test('should handle custom registry URLs', () => {
    (parseDockerImage as any).mockReturnValue({
      registry_type: 'CUSTOM',
      repository: 'project/app',
      tag: 'latest'
    });

    const result = getImageUrl('custom.registry.com/project/app:latest');
    
    // For custom registries, the function should return the original string
    expect(result).toBe('custom.registry.com/project/app:latest');
    expect(parseDockerImage).toHaveBeenCalledWith('custom.registry.com/project/app:latest');
  });

  test('should exclude tag from image URL when specified', () => {
    (parseDockerImage as any).mockReturnValue({
      registry_type: RegistryType.DOCKER_HUB,
      repository: 'nginx',
      tag: 'latest'
    });

    const result = getImageUrl('nginx:latest', false);
    
    expect(result).toBe('docker.io/library/nginx');
    expect(parseDockerImage).toHaveBeenCalledWith('nginx:latest');
  });

  test('should exclude tag from custom registry URLs when specified', () => {
    // This test specifically targets lines 25-28 which were uncovered
    (parseDockerImage as any).mockReturnValue({
      registry_type: 'CUSTOM',
      repository: 'custom/image',
      tag: 'v1.2.3'
    });

    const result = getImageUrl('custom.registry.com/custom/image:v1.2.3', false);
    
    // For custom registries with includeTag=false, it should return just the part before the colon
    expect(result).toBe('custom.registry.com/custom/image');
    expect(parseDockerImage).toHaveBeenCalledWith('custom.registry.com/custom/image:v1.2.3');
  });
});
