export interface PropertyMapping {
  render: string;
  digitalOcean: string;
}

export const servicePropertyMappings: Record<string, PropertyMapping> = {
  'host': {
    render: 'host',
    digitalOcean: 'PRIVATE_DOMAIN'
  },
  'port': {
    render: 'port',
    digitalOcean: 'PRIVATE_PORT'
  },
  'hostport': {
    render: 'hostport',
    digitalOcean: 'PRIVATE_URL'
  }
};

export const databasePropertyMappings: Record<string, PropertyMapping> = {
  'connectionString': {
    render: 'connectionString',
    digitalOcean: 'DATABASE_URL'
  },
  'username': {
    render: 'user',
    digitalOcean: 'USERNAME'
  },
  'password': {
    render: 'password',
    digitalOcean: 'PASSWORD'
  },
  'databaseName': {
    render: 'database',
    digitalOcean: 'DATABASE'
  }
};

/**
 * Gets the correct property name for a specific provider
 * 
 * @param property - The generic property name
 * @param provider - The target provider
 * @param isDatabase - Whether this is a database property
 * @returns The provider-specific property name
 */
export function getPropertyForProvider(
  property: string, 
  provider: 'render' | 'digitalOcean',
  isDatabase: boolean
): string {
  const mappings = isDatabase ? databasePropertyMappings : servicePropertyMappings;
  
  if (!mappings[property]) {
    console.warn(`Unknown property: ${property}. Using as-is.`);
    return property;
  }
  
  return mappings[property][provider] || property;
}
