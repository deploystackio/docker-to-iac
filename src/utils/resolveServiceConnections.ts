import { ApplicationConfig } from '../types/container-config';
import { 
  ServiceConnectionsConfig, 
  ResolvedServiceConnection,
  ProviderConnectionConfig
} from '../types/service-connections';
import { getServiceNameTransformer } from './serviceNameTransformers';
import { isRenderDatabaseService } from './isRenderDatabaseService';
import { isDigitalOceanManagedDatabase } from './isDigitalOceanManagedDatabase';
import { getRenderServiceType } from './getRenderServiceType';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { getPropertyForProvider } from '../config/connection-properties';

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
    const { fromService, toService, environmentVariables, property } = mapping;
    
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

    // Determine if target service is a database (based on provider)
    const isTargetDatabase = 
      (providerConfig.implementationType === 'blueprint-reference' && isRenderDatabaseService(config.services[toService].image)) ||
      (providerConfig.serviceNameTransformer === 'digitalOcean' && isDigitalOceanManagedDatabase(config.services[toService].image));

    // Get the target service image URL for specific checks
    const targetImageUrl = getImageUrl(constructImageString(config.services[toService].image));

    // Get the requested property or use default
    const requestedProperty = property || 
      (isTargetDatabase ? 'connectionString' : 'hostport');

    // Get provider-specific property name
    const providerProperty = getPropertyForProvider(
      requestedProperty,
      providerConfig.implementationType === 'blueprint-reference' ? 'render' : 'digitalOcean',
      isTargetDatabase
    );

    // Process each environment variable that references the target service
    for (const varName of environmentVariables) {
      const matchingVarNames = Object.keys(serviceEnv).filter(envKey => 
        envKey === varName || envKey.includes(varName)
      );
      
      if (matchingVarNames.length > 0) {
        for (const matchedVarName of matchingVarNames) {
          const originalValue = serviceEnv[matchedVarName];
          let transformedValue = originalValue;
          
          // For Render.com with blueprint references
          if (providerConfig.implementationType === 'blueprint-reference') {
            // We'll handle this by setting a flag and updating at the end of the loop
            // as Render uses a different structure than simple string replacement

            // Remove existing environment variable as it will be replaced with a fromService reference
            delete config.services[fromService].environment[matchedVarName];
          } 
          // For DigitalOcean and other providers that use string replacement
          else {
            // Get the appropriate transformer function
            const transformerFn = getServiceNameTransformer(providerConfig.serviceNameTransformer);
            
            // Transform the service name
            const transformedServiceName = transformerFn(toService);
            
            // Handle different types of references based on service type
            if (isTargetDatabase && providerConfig.serviceNameTransformer === 'digitalOcean') {
              // For databases on DigitalOcean, use the database reference syntax
              transformedValue = `\${${transformedServiceName}-db.${providerProperty}}`;
            } else {
              // For regular services on DigitalOcean, use the service reference syntax
              transformedValue = `\${${transformedServiceName}.${providerProperty}}`;
            }
            
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
    
    
    // For Render.com, add fromService or fromDatabase references directly to the service config
    if (providerConfig.implementationType === 'blueprint-reference') {
      // Ensure envVars exists
      if (!config.services[fromService].envVars) {
        config.services[fromService].envVars = [];
      }
      
      // Get the actual service with envVars
      const serviceConfig = config.services[fromService] as any;
      
      for (const varName of environmentVariables) {
        // If this is a database target
        if (isTargetDatabase) {
          // Specifically check for PostgreSQL
          if (targetImageUrl.includes('postgres')) {

            // This should be fromDatabase with the postgres-db name
            serviceConfig.envVars.push({
              key: varName,
              fromDatabase: {
                name: `${toService}-db`, // Add -db suffix for database name
                property: 'connectionString'  // Force connectionString for databases
              }
            });
          } else if (targetImageUrl.includes('redis')) {
            // Redis uses fromService with type: redis
            serviceConfig.envVars.push({
              key: varName,
              fromService: {
                name: toService,
                type: 'redis',
                property: 'connectionString'
              }
            });
          }
        } else {
          console.log(`Adding regular fromService reference for ${varName}`);
          // Regular service reference
          serviceConfig.envVars.push({
            key: varName,
            fromService: {
              name: toService,
              type: getRenderServiceType(config.services[toService].image),
              property: providerProperty
            }
          });
        }
      }      
    }
    
    
    resolvedConnections.push(resolvedConnection);
  }
  
  return resolvedConnections;
}
