// src/utils/resolveServiceConnections.ts
import { ApplicationConfig } from '../types/container-config';
import { 
  ServiceConnectionsConfig, 
  ResolvedServiceConnection,
  ProviderServiceConnectionConfig,
  ServiceTypeMapping
} from '../types/service-connections';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';

/**
 * Detect service type based on image name
 */
function detectServiceType(
  imageName: string, 
  serviceTypeMappings: ServiceTypeMapping[]
): { serviceType: string, defaultPort: number } {
  for (const mapping of serviceTypeMappings) {
    if (imageName.includes(mapping.imagePattern)) {
      return {
        serviceType: mapping.serviceType,
        defaultPort: mapping.defaultPort
      };
    }
  }
  
  // Default to generic web service
  return {
    serviceType: 'web',
    defaultPort: 80
  };
}

/**
 * Get service type mappings for various common images
 */
function getServiceTypeMappings(): ServiceTypeMapping[] {
  return [
    { imagePattern: 'mysql', serviceType: 'mysql', defaultPort: 3306 },
    { imagePattern: 'mariadb', serviceType: 'mariadb', defaultPort: 3306 },
    { imagePattern: 'postgres', serviceType: 'postgres', defaultPort: 5432 },
    { imagePattern: 'redis', serviceType: 'redis', defaultPort: 6379 },
    { imagePattern: 'mongodb', serviceType: 'mongodb', defaultPort: 27017 },
    { imagePattern: 'nginx', serviceType: 'web', defaultPort: 80 },
    { imagePattern: 'node', serviceType: 'web', defaultPort: 8080 },
  ];
}

/**
 * Resolve service connections for a specific cloud provider
 */
export function resolveServiceConnections(
  config: ApplicationConfig,
  serviceConnections: ServiceConnectionsConfig,
  providerConfig: ProviderServiceConnectionConfig
): ResolvedServiceConnection[] {
  const resolvedConnections: ResolvedServiceConnection[] = [];
  const serviceTypeMappings = getServiceTypeMappings();
  
  for (const mapping of serviceConnections.mappings) {
    const { fromService, toService, environmentVariables } = mapping;
    
    // Skip if services don't exist
    if (!config.services[fromService] || !config.services[toService]) {
      console.warn(`Missing service in connection mapping: ${fromService} -> ${toService}`);
      continue;
    }
    
    const toServiceImage = config.services[toService].image;
    const imageName = getImageUrl(constructImageString(toServiceImage));
    
    // Detect service type for the target service
    const { serviceType, defaultPort } = detectServiceType(imageName, serviceTypeMappings);
    
    // Determine the connection format to use
    let connectionFormat = providerConfig.defaultFormat;
    if (providerConfig.serviceFormats && providerConfig.serviceFormats[serviceType]) {
      connectionFormat = providerConfig.serviceFormats[serviceType];
    }
    
    // Create resolved variables
    const resolvedVars: Record<string, string> = {};
    
    for (const [varName, varConfig] of Object.entries(environmentVariables)) {
      // Determine port to use
      const port = varConfig.port || providerConfig.defaultPorts[serviceType] || defaultPort;
      
      // Determine format to use (variable specific, or the connection format)
      const format = varConfig.format || connectionFormat;
      
      // Replace variables in the format
      let value = format.replace('${serviceName}', toService)
                        .replace('${port}', port.toString());
      
      resolvedVars[varName] = value;
    }
    
    // Add to resolved connections
    resolvedConnections.push({
      fromService,
      toService,
      variables: resolvedVars,
      resolvedServiceName: toService
    });
  }
  
  return resolvedConnections;
}
