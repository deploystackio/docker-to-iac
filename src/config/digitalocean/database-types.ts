interface DatabaseConfig {
  engine: string;
  versions: string[];
  description: string;
}

interface DigitalOceanDatabaseConfig {
  databases: {
    [key: string]: DatabaseConfig;
  };
}

export const digitalOceanDatabaseConfig: DigitalOceanDatabaseConfig = {
  databases: {
    'docker.io/library/mysql': {
      engine: 'MYSQL',
      versions: ['8'],
      description: 'MySQL database service - requires managed database service due to TCP protocol'
    },
    'docker.io/library/mariadb': {
      engine: 'MYSQL',
      versions: ['8'],
      description: 'MariaDB database service - maps to MySQL managed database due to compatibility'
    },
    'docker.io/library/postgres': {
      engine: 'PG',
      versions: ['13', '14', '15'],
      description: 'PostgreSQL database service - requires managed database service due to TCP protocol'
    },
    'docker.io/library/redis': {
      engine: 'REDIS',
      versions: ['6', '7'],
      description: 'Redis database service - requires managed database service due to TCP protocol'
    },
    'docker.io/library/mongodb': {
      engine: 'MONGODB',
      versions: ['6.0', '7.0'],
      description: 'MongoDB database service - requires managed database service due to TCP protocol'
    }
  }
};

export type { DatabaseConfig, DigitalOceanDatabaseConfig };