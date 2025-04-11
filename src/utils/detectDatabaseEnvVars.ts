import { detectDatabaseUrl } from './detectDatabaseUrl';

/**
 * Detects and returns environment variables that appear to be database connection strings
 * along with their corresponding service name
 */
export function detectDatabaseEnvironmentVariables(
  environment: Record<string, string>,
  knownServices: string[]
): Map<string, string[]> {
  // Map of service name to array of environment variable keys
  const serviceToEnvVars = new Map<string, string[]>();
  
  for (const [key, value] of Object.entries(environment)) {
    if (typeof value === 'string') {
      // Common database URL environment variable names
      const isDatabaseUrlKey = 
        key === 'DATABASE_URL' || 
        key.includes('_DATABASE_URL') ||
        key.includes('_CONNECTION_STRING') ||
        key.includes('_CONN_URL') ||
        key === 'POSTGRES_URL' ||
        key === 'REDIS_URL' ||
        key === 'MONGODB_URI';
        
      // Try to detect database URL
      const databaseUrl = detectDatabaseUrl(value);
      
      if (databaseUrl && knownServices.includes(databaseUrl.host)) {
        // This is a database URL environment variable referencing a known service
        const serviceEnvVars = serviceToEnvVars.get(databaseUrl.host) || [];
        serviceEnvVars.push(key);
        serviceToEnvVars.set(databaseUrl.host, serviceEnvVars);
      } else if (isDatabaseUrlKey) {
        // Check for exact service name matches in the URL
        for (const serviceName of knownServices) {
          if (value.includes(`@${serviceName}:`) || value.includes(`@${serviceName}/`)) {
            const serviceEnvVars = serviceToEnvVars.get(serviceName) || [];
            serviceEnvVars.push(key);
            serviceToEnvVars.set(serviceName, serviceEnvVars);
            break;
          }
        }
      }
    }
  }
  
  return serviceToEnvVars;
}

/**
 * Automatically creates service connection configurations based on environment variables
 */
export function generateDatabaseServiceConnections(
  config: { services: Record<string, { environment: Record<string, string> }> }
): Array<{ fromService: string, toService: string, environmentVariables: string[] }> {
  const connections: Array<{ 
    fromService: string, 
    toService: string, 
    environmentVariables: string[] 
  }> = [];
  
  // Get all service names
  const serviceNames = Object.keys(config.services);
  
  // Check each service for database connections to other services
  for (const fromService of serviceNames) {
    const environment = config.services[fromService].environment;
    
    // Detect database environment variables
    const databaseConnections = detectDatabaseEnvironmentVariables(
      environment,
      serviceNames
    );
    
    // Create connection mappings
    for (const [toService, envVars] of databaseConnections.entries()) {
      if (envVars.length > 0) {
        connections.push({
          fromService,
          toService,
          environmentVariables: envVars
        });
      }
    }
  }
  
  return connections;
}
