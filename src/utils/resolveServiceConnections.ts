import { ApplicationConfig } from '../types/container-config';
import { 
  ServiceConnectionsConfig, 
  ResolvedServiceConnection
} from '../types/service-connections';

/**
 * Resolve service connections between components without provider-specific transformations
 * This provides basic information about service connections that each parser can use
 * to implement its own specific connection syntax
 */
export function resolveServiceConnections(
  config: ApplicationConfig,
  serviceConnections: ServiceConnectionsConfig
): ResolvedServiceConnection[] {
  const resolvedConnections: ResolvedServiceConnection[] = [];

  for (const mapping of serviceConnections.mappings) {
    const { fromService, toService, environmentVariables } = mapping;
    
    // Skip if services don't exist
    if (!config.services[fromService] || !config.services[toService]) {
      console.warn(`Missing service in connection mapping: ${fromService} -> ${toService}`);
      continue;
    }
    
    // Get environment variables for the source service
    const serviceEnv = config.services[fromService].environment;
    
    // Create resolved connection
    const resolvedConnection: ResolvedServiceConnection = {
      fromService,
      toService,
      property: mapping.property || 'hostport', // Default property is hostport
      variables: {}
    };

    // Process each environment variable that references the target service
    for (const varName of environmentVariables) {
      const matchingVarNames = Object.keys(serviceEnv).filter(envKey => 
        envKey === varName || envKey.includes(varName)
      );
      
      if (matchingVarNames.length > 0) {
        for (const matchedVarName of matchingVarNames) {
          const originalValue = serviceEnv[matchedVarName];
          
          // Store the original value but don't transform it here
          // Let each parser implement its own transformation
          resolvedConnection.variables[matchedVarName] = {
            originalValue,
            transformedValue: originalValue // Initially the same, parsers will override this
          };
        }
      }
    }
    
    resolvedConnections.push(resolvedConnection);
  }
  
  return resolvedConnections;
}
