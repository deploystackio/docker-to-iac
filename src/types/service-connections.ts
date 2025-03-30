/**
 * Connection string format template
 * Can include variables like ${serviceName}, ${originalValue}, etc.
 */
export type ConnectionFormat = string;

/**
 * Provider-specific service connection configuration
 */
export interface ProviderConnectionConfig {
  // The format template to use for service references 
  // (can use ${serviceName} as a variable)
  serviceReferenceFormat?: ConnectionFormat;
  
  // Whether to use provider's native service reference mechanism
  // instead of string replacement
  useProviderNativeReferences?: boolean;
  
  // What type of native implementation to use
  implementationType?: 'blueprint-reference' | 'service-discovery';
}

/**
 * Service connection mapping
 */
export interface ServiceConnectionMapping {
  // The source service that has environment variables
  fromService: string;
  
  // The target service that is referenced in environment variables
  toService: string;
  
  // Environment variable names that contain service references
  environmentVariables: string[];
}

/**
 * Service connections input configuration
 */
export interface ServiceConnectionsConfig {
  mappings: ServiceConnectionMapping[];
}

/**
 * Single resolved environment variable
 */
export interface ResolvedConnectionVariable {
  // Original value from Docker Compose
  originalValue: string;
  
  // Transformed value for the target cloud provider
  transformedValue: string;
}

/**
 * Resolved connection information after processing
 */
export interface ResolvedServiceConnection {
  // Source service with the environment variables
  fromService: string;
  
  // Target service being referenced
  toService: string;
  
  // Environment variables that were transformed
  variables: {
    [key: string]: ResolvedConnectionVariable;
  };
}
