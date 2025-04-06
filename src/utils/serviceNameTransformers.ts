import { digitalOceanParserServiceName } from './digitalOceanParserServiceName';

// Registry of service name transformers
export const serviceNameTransformers: Record<string, (serviceName: string) => string> = {
  'digitalOcean': digitalOceanParserServiceName,
  // Add other transformers here as needed
  'default': (serviceName: string) => serviceName // Identity transformer
};

// Function to get a transformer by name
export function getServiceNameTransformer(transformerName?: string): (serviceName: string) => string {
  if (!transformerName) return serviceNameTransformers.default;
  return serviceNameTransformers[transformerName] || serviceNameTransformers.default;
}
