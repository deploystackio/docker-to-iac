import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { digitalOceanDatabaseConfig } from '../config/digitalocean/database-types';

export interface DatabaseInfo {
  engine: string;
  version: string;
}

export function getDigitalOceanDatabaseType(image: DockerImageInfo): DatabaseInfo | null {
  const normalizedImage = getImageUrl(constructImageString(image));

  for (const [configImage, dbConfig] of Object.entries(digitalOceanDatabaseConfig.databases)) {
    if (normalizedImage.includes(configImage)) {
      return {
        engine: dbConfig.engine,
        version: dbConfig.versions[0]
      };
    }
  }

  return null;
}