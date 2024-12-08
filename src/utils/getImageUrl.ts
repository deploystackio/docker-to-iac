import { RegistryType } from '../parsers/base-parser';
import { parseDockerImage } from './parseDockerImage';

export const getImageUrl = (imageString: string): string => {
  const imageInfo = parseDockerImage(imageString);
  
  switch (imageInfo.registry_type) {
    case RegistryType.GHCR:
      return `ghcr.io/${imageInfo.repository}${imageInfo.tag ? `:${imageInfo.tag}` : ''}`;
    case RegistryType.DOCKER_HUB:
      // For Docker Hub, we need to handle official images differently
      if (!imageInfo.repository.includes('/')) {
        return `docker.io/library/${imageInfo.repository}${imageInfo.tag ? `:${imageInfo.tag}` : ''}`;
      }
      return `docker.io/${imageInfo.repository}${imageInfo.tag ? `:${imageInfo.tag}` : ''}`;
    default:
      // For custom registries, use the full image string as is
      return imageString;
  }
};
