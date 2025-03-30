import { ProviderConnectionConfig } from '../types/service-connections';

/**
 * Provider-specific connection formats
 */
export const providerConnectionConfigs: Record<string, ProviderConnectionConfig> = {
  // AWS CloudFormation
  'CFN': {
    // In ECS, services connect via service names within the same task
    serviceReferenceFormat: '${serviceName}'
  },
  
  // Render.com
  'RND': {
    // Render services connect to each other using the service name
    serviceReferenceFormat: '${serviceName}'
  },
  
  // DigitalOcean App Platform
  'DOP': {
    // DigitalOcean App Platform uses internal hostnames
    serviceReferenceFormat: '${serviceName}.internal'
  }
};
