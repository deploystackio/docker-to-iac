import { ProviderConnectionConfig } from '../types/service-connections';

/**
 * Provider-specific connection formats
 * Note: AWS CloudFormation removed as it doesn't support direct service-to-service communication
 * in a way that can be templated with environment variables
 */
export const providerConnectionConfigs: Record<string, ProviderConnectionConfig> = {
  // Render.com - using blueprint fromService or fromDatabase syntax
  'RND': {
    useProviderNativeReferences: true,
    implementationType: 'blueprint-reference'
  },
  
  // DigitalOcean App Platform - service name or database reference
  'DOP': {
    serviceNameTransformer: 'digitalOcean'
  }
};
