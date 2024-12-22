import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { renderServiceTypesConfig } from '../config/render/service-types';

export function getRenderServiceType(image: DockerImageInfo): string {

  const normalizedImage = getImageUrl(constructImageString(image));
  
  for (const [configImage, serviceConfig] of Object.entries(renderServiceTypesConfig.serviceTypes)) {
    if (normalizedImage.includes(configImage)) {
      return serviceConfig.type;
    }
  }

  // Default to 'web' if no match is found
  return 'web';
}
