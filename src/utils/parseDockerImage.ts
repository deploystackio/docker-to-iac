// file: utils/parseDockerImage.ts
import { DockerImageInfo, RegistryType } from '../parsers/base-parser';

export const parseDockerImage = (imageString: string): DockerImageInfo => {
  if (typeof imageString !== 'string') {
    throw new Error('Docker image must be a string');
  }

  if (!imageString.trim()) {
    throw new Error('Docker image string cannot be empty');
  }

  // Remove any whitespace
  const cleanImageString = imageString.trim();

  let registry_type = RegistryType.DOCKER_HUB;
  let registry: string | undefined;
  let repository: string;
  let tag: string | undefined = 'latest';
  let digest: string | undefined;

  // Split the image string into parts
  const parts = cleanImageString.split('/');

  // Check if image has a registry
  if (cleanImageString.includes('ghcr.io')) {
    registry_type = RegistryType.GHCR;
    registry = parts[0];
    parts.shift(); // Remove the registry part
  } else if (parts.length > 1 && (parts[0].includes('.') || parts[0].includes(':'))) {
    registry = parts[0];
    parts.shift(); // Remove the registry part
  }

  // Join remaining parts to get repository
  repository = parts.join('/');

  // Handle digest or tag
  if (repository.includes('@sha256:')) {
    const [repoName, digestValue] = repository.split('@sha256:');
    repository = repoName;
    digest = `sha256:${digestValue}`;
    tag = undefined;
  } else if (repository.includes(':')) {
    const [repoName, tagValue] = repository.split(':');
    repository = repoName;
    tag = tagValue;
  }

  return {
    registry_type,
    ...(registry && { registry }),
    repository,
    ...(tag && { tag }),
    ...(digest && { digest })
  };
};
