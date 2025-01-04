import { DockerImageInfo } from '../parsers/base-parser';

export function normalizeDigitalOceanImageInfo(dockerImageInfo: DockerImageInfo): {
  registry: string;
  repository: string;
} {
  // Get fully qualified name from registry
  const registryPath = dockerImageInfo.registry || 'docker.io';
  const repositoryPath = dockerImageInfo.repository;

  // For docker.io/library/[name] format
  if (registryPath === 'docker.io' && repositoryPath.startsWith('library/')) {
    return {
      registry: 'library',
      repository: repositoryPath.replace('library/', '')
    };
  }

  // For docker.io/[owner]/[name] format
  if (registryPath === 'docker.io') {
    // Check if it's a direct image name without owner (official image)
    if (!repositoryPath.includes('/')) {
      return {
        registry: 'library',
        repository: repositoryPath
      };
    }
    
    const parts = repositoryPath.split('/');
    return {
      registry: parts[0],
      repository: parts[1] || parts[0]
    };
  }

  // For other registries, keep as is
  return {
    registry: dockerImageInfo.registry || 'library',
    repository: dockerImageInfo.repository
  };
}
