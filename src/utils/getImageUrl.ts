import { RegistryType } from '../parsers/base-parser';
import { parseDockerImage } from './parseDockerImage';

/**
 * Gets the full URL for a Docker image
 * 
 * @param imageString The image string to parse
 * @param includeTag Whether to include the tag in the output. Defaults to true.
 * @returns Formatted image URL
 */
export const getImageUrl = (imageString: string, includeTag: boolean = true): string => {
  const imageInfo = parseDockerImage(imageString);
  
  switch (imageInfo.registry_type) {
    case RegistryType.GHCR:
      return `ghcr.io/${imageInfo.repository}${includeTag && imageInfo.tag ? `:${imageInfo.tag}` : ''}`;
    case RegistryType.DOCKER_HUB:
      // For Docker Hub, we need to handle official images differently
      if (!imageInfo.repository.includes('/')) {
        return `docker.io/library/${imageInfo.repository}${includeTag && imageInfo.tag ? `:${imageInfo.tag}` : ''}`;
      }
      return `docker.io/${imageInfo.repository}${includeTag && imageInfo.tag ? `:${imageInfo.tag}` : ''}`;
    default:
      // For custom registries, use the full image string as is
      if (!includeTag && imageString.includes(':')) {
        return imageString.split(':')[0];
      }
      return imageString;
  }
};
