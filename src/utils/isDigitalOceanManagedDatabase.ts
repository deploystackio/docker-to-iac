import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { digitalOceanDatabaseConfig } from '../config/digitalocean/database-types';

export function isDigitalOceanManagedDatabase(image: DockerImageInfo): boolean {
  const normalizedImage = getImageUrl(constructImageString(image));
  
  for (const [configImage, dbConfig] of Object.entries(digitalOceanDatabaseConfig.databases)) {
    if (normalizedImage.includes(configImage) && dbConfig.isManaged) {
      return true;
    }
  }

  return false;
}
