interface RenderServiceTypeConfig {
  type: string;
  description: string;
  versions: string;
  isManaged?: boolean;
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
      type: 'database',
      description: 'PostgreSQL database - creates a managed database in databases section',
      versions: '*',
      isManaged: true
    },
    'docker.io/library/redis': {
      type: 'redis',
      description: 'Redis database - creates a keyvalue service with type: redis',
      versions: '*',
      isManaged: true
    }
  }
};

export type { RenderServiceTypeConfig, RenderServiceTypesConfig };
