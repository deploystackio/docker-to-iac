import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { renderServiceTypesConfig } from '../config/render/service-types';

export function isRenderDatabaseService(image: DockerImageInfo): boolean {
  const normalizedImage = getImageUrl(constructImageString(image));
  
  // Check for managed database services (PostgreSQL and Redis)
  if (normalizedImage.includes('postgres') || normalizedImage.includes('redis')) {
    // Find explicit configuration
    for (const [configImage, serviceConfig] of Object.entries(renderServiceTypesConfig.serviceTypes)) {
      if (normalizedImage.includes(configImage) && serviceConfig.isManaged) {
        return true;
      }
    }
    
    // Default to true for postgres and redis even if not explicitly configured
    return true;
  }

  return false;
}
