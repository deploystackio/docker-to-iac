import { ApplicationConfig } from '../types/container-config';
import { DockerImageInfo } from '../parsers/base-parser';
import { getImageUrl } from './getImageUrl';
import { constructImageString } from './constructImageString';
import { getDatabaseConfig } from '../config/helm/database-types';

// Common database connection string patterns
const connectionPatterns = [
  /postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+/i,
  /mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+/i,
  /mongodb:\/\/[^:]+:[^@]+@[^:]+:\d+\/\w+/i,
  /redis:\/\/[^:]+:[^@]+@[^:]+:\d+/i
];

// Common database-related environment variable names
const databaseEnvVarPatterns = [
  /db_?(uri|url|conn(ection)?(_?string)?)/i,
  /(postgres|mysql|mongo|redis)_?(uri|url|conn(ection)?(_?string)?)/i,
  /database_?(uri|url|conn(ection)?(_?string)?)/i
];

/**
 * Determines if a given Docker image is a supported database image for Helm charts
 */
export function isHelmDatabaseImage(image: DockerImageInfo): boolean {
  const dbConfig = getDatabaseConfig(getImageUrl(constructImageString(image)));
  return dbConfig !== null;
}

/**
 * Processes database configuration for Helm charts, including environment variables
 * and Helm chart-specific settings
 * 
 * @param serviceName Database service name
 * @param serviceConfig Service configuration
 * @returns Processed database configuration for Helm values.yaml
 */
export function processHelmDatabaseConfig(
  serviceName: string, 
  serviceConfig: any
): any {
  const imageUrl = getImageUrl(constructImageString(serviceConfig.image));
  const dbConfig = getDatabaseConfig(imageUrl);
  
  if (!dbConfig) {
    return null;
  }

  // Start with template values from the database config
  const dbValues = { ...dbConfig.valueTemplate };
  
  // Extract environment variables
  const env = serviceConfig.environment;
  
  // Apply any environment variables to the template
  const variablePattern = /\${([^}]+)}/g;
  
  // Convert the values to a JSON string to easily replace all occurrences
  let valuesString = JSON.stringify(dbValues);
  
  // Replace variables with values from environment
  valuesString = valuesString.replace(variablePattern, (match, varName) => {
    return env[varName] || match; // Keep the original if not found
  });
  
  // Parse back to object
  return JSON.parse(valuesString);
}

/**
 * Determines if an environment variable appears to be a database connection variable
 */
export function isDatabaseConnectionVar(varName: string, varValue: string): boolean {
  // Check for common database variable naming patterns
  const isDbVarName = databaseEnvVarPatterns.some(pattern => pattern.test(varName));
  
  // Check for connection string patterns in the value
  const isConnectionString = connectionPatterns.some(pattern => pattern.test(varValue));
  
  // Simple check for database components in the name
  const dbComponents = ['host', 'port', 'user', 'password', 'database', 'db'];
  const hasDbComponent = dbComponents.some(component => 
    varName.toLowerCase().includes(component.toLowerCase())
  );
  
  return isDbVarName || isConnectionString || hasDbComponent;
}

/**
 * Detects potential database connection environment variables and returns their mappings
 * This is specific to the Helm chart implementation
 */
export function detectHelmDatabaseConnections(config: ApplicationConfig): Array<{
  fromService: string;
  toService: string;
  environmentVariables: string[];
}> {
  const result: Array<{
    fromService: string;
    toService: string;
    environmentVariables: string[];
  }> = [];
  
  // First, identify all database services
  const databaseServices = new Map<string, DockerImageInfo>();
  
  for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
    if (isHelmDatabaseImage(serviceConfig.image)) {
      databaseServices.set(serviceName, serviceConfig.image);
    }
  }
  
  // No database services found, nothing to do
  if (databaseServices.size === 0) {
    return result;
  }
  
  // Look for services that might connect to databases
  for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
    // Skip database services themselves
    if (databaseServices.has(serviceName)) {
      continue;
    }
    
    // Check environment variables for potential database connections
    const dbConnections = new Map<string, string[]>();
    
    for (const [varName, varValue] of Object.entries(serviceConfig.environment)) {
      if (isDatabaseConnectionVar(varName, varValue.toString())) {
        // Try to match this variable to a database service
        for (const [dbServiceName] of databaseServices) {
          // Simple string match in the value (could be enhanced)
          if (varValue.toString().includes(dbServiceName)) {
            if (!dbConnections.has(dbServiceName)) {
              dbConnections.set(dbServiceName, []);
            }
            dbConnections.get(dbServiceName)!.push(varName);
          }
        }
      }
    }
    
    // Add detected connections to the result
    for (const [dbServiceName, variables] of dbConnections) {
      if (variables.length > 0) {
        result.push({
          fromService: serviceName,
          toService: dbServiceName,
          environmentVariables: variables
        });
      }
    }
  }
  
  return result;
}
