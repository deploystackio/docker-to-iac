import { readFileSync } from 'fs';
import { join } from 'path';
import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';

interface ServiceTypeConfig {
  type: string;
  description: string;
  versions: string;
}

interface ServiceTypesConfig {
  serviceTypes: {
    [key: string]: ServiceTypeConfig;
  };
}

let serviceTypesConfig: ServiceTypesConfig | null = null;

function loadServiceTypesConfig(): ServiceTypesConfig {
  if (serviceTypesConfig === null) {
    const configPath = join(__dirname, '../config/render/service-types.json');
    try {
      const configContent = readFileSync(configPath, 'utf8');
      serviceTypesConfig = JSON.parse(configContent);
    } catch (error) {
      console.warn('Failed to load Render service types config:', error);
      return { serviceTypes: {} };
    }
  }
  return serviceTypesConfig || { serviceTypes: {} };
}

export function getRenderServiceType(image: DockerImageInfo): string {
  const config = loadServiceTypesConfig();
  
  // Use our existing utilities to normalize the image format
  const normalizedImage = getImageUrl(constructImageString(image));
  
  // Check if the normalized image matches any configured service types
  for (const [configImage, serviceConfig] of Object.entries(config.serviceTypes)) {
    if (normalizedImage.includes(configImage)) {
      return serviceConfig.type;
    }
  }

  // Default to 'web' if no match is found
  return 'web';
}
