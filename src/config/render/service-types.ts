interface RenderServiceTypeConfig {
  type: string;
  description: string;
  versions: string;
}

interface RenderServiceTypesConfig {
  serviceTypes: {
    [key: string]: RenderServiceTypeConfig;
  };
}

export const renderServiceTypesConfig: RenderServiceTypesConfig = {
  serviceTypes: {
    'docker.io/library/mariadb': {
      type: 'pserv',
      description: 'MariaDB database service - requires private service type due to TCP protocol',
      versions: '*'
    },
    'docker.io/library/mysql': {
      type: 'pserv',
      description: 'MySQL database service - requires private service type due to TCP protocol',
      versions: '*'
    },
    'docker.io/library/postgres': {
      type: 'pserv',
      description: 'PostgreSQL database service - requires private service type due to TCP protocol',
      versions: '*'
    }
  }
};

// Export types for use in other files
export type { RenderServiceTypeConfig, RenderServiceTypesConfig };