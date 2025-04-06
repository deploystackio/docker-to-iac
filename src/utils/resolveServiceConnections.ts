import { ApplicationConfig } from '../types/container-config';
import { 
  ServiceConnectionsConfig, 
  ResolvedServiceConnection,
  ProviderConnectionConfig
} from '../types/service-connections';
import { getServiceNameTransformer } from './serviceNameTransformers';

/**
 * Replace service references in environment variable values based on provider configuration
 */
export function resolveServiceConnections(
  config: ApplicationConfig,
  serviceConnections: ServiceConnectionsConfig,
  providerConfig: ProviderConnectionConfig
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
          let transformedValue = originalValue;
          
          if (!providerConfig.useProviderNativeReferences) {
            // Get the appropriate transformer function
            const transformerFn = getServiceNameTransformer(providerConfig.serviceNameTransformer);
            
            // Transform the service name
            const transformedServiceName = transformerFn(toService);
            
            // Use the transformed name
            transformedValue = transformedServiceName;
            
            // Update the environment variable
            config.services[fromService].environment[matchedVarName] = transformedValue;
          }
          
          resolvedConnection.variables[matchedVarName] = {
            originalValue,
            transformedValue
          };
        }
      }
    }
    
    resolvedConnections.push(resolvedConnection);
  }
  
  return resolvedConnections;
}
