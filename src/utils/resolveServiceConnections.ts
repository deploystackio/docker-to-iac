import { ApplicationConfig } from '../types/container-config';
import { 
  ServiceConnectionsConfig, 
  ResolvedServiceConnection,
  ProviderConnectionConfig
} from '../types/service-connections';

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
      if (varName in serviceEnv) {
        const originalValue = serviceEnv[varName];
        
        // Apply the provider's service reference format
        let transformedValue = originalValue;
        
        // Replace exact service name with the provider-specific format
        const serviceNamePattern = new RegExp(`\\b${toService}\\b`, 'g');
        const replacementValue = providerConfig.serviceReferenceFormat.replace('${serviceName}', toService);
        
        transformedValue = transformedValue.replace(serviceNamePattern, replacementValue);
        
        // Store the original and transformed values
        resolvedConnection.variables[varName] = {
          originalValue,
          transformedValue
        };
        
        // Update the environment variable in the source service
        config.services[fromService].environment[varName] = transformedValue;
      }
    }
    
    resolvedConnections.push(resolvedConnection);
  }
  
  return resolvedConnections;
}
