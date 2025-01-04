import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { digitalOceanDatabaseConfig, DatabaseConfig } from '../config/digitalocean/database-types';

export function getDigitalOceanDatabaseType(image: DockerImageInfo): DatabaseConfig | null {
  const normalizedImage = getImageUrl(constructImageString(image));

  for (const [configImage, dbConfig] of Object.entries(digitalOceanDatabaseConfig.databases)) {
    if (normalizedImage.includes(configImage)) {
      return dbConfig;
    }
  }

  return null;
}
