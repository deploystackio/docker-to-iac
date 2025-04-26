import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { helmDatabaseConfig, DatabaseConfig } from '../config/helm/database-types';

/**
 * Gets the Helm chart configuration for a database Docker image, if available
 * 
 * @param image The Docker image info to check
 * @returns Database configuration or null if not a supported database
 */
export function getHelmDatabaseType(image: DockerImageInfo): DatabaseConfig | null {
  const normalizedImage = getImageUrl(constructImageString(image));

  for (const [configImage, dbConfig] of Object.entries(helmDatabaseConfig.databases)) {
    if (normalizedImage.includes(configImage)) {
      return dbConfig;
    }
  }

  return null;
}

/**
 * Checks if a Docker image represents a database that should be handled
 * as a separate Helm dependency chart
 * 
 * @param image The Docker image info to check
 * @returns True if the image is a database that should use a Helm chart
 */
export function isHelmManagedDatabase(image: DockerImageInfo): boolean {
  return getHelmDatabaseType(image) !== null;
}
