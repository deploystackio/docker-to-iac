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
  serviceReferenceFormat?: ConnectionFormat;
  
  // Whether to use provider's native service reference mechanism
  useProviderNativeReferences?: boolean;
  
  // What type of native implementation to use
  implementationType?: 'blueprint-reference' | 'service-discovery';
  
  // Name of the service transformer function to use (e.g., 'digitalOcean')
  serviceNameTransformer?: string;
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
