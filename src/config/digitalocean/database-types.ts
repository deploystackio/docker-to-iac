interface DatabaseConfig {
  engine: string;
  description: string;
  portNumber: number;
  isManaged?: boolean;
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
      description: 'MySQL database service - requires managed database service due to TCP protocol',
      portNumber: 3306
    },
    'docker.io/library/mariadb': {
      engine: 'MYSQL',
      description: 'MariaDB database service - maps to MySQL managed database due to compatibility',
      portNumber: 3306
    },
    'docker.io/library/postgres': {
      engine: 'PG',
      description: 'PostgreSQL database service - creates a managed database instance',
      portNumber: 5432,
      isManaged: true
    },
    'docker.io/library/redis': {
      engine: 'REDIS',
      description: 'Redis database service - creates a managed database instance',
      portNumber: 6379
    },
    'docker.io/library/mongodb': {
      engine: 'MONGODB',
      description: 'MongoDB database service - requires managed database service due to TCP protocol',
      portNumber: 27017
    }
  }
};

export function isDatabaseService(imageString: string): boolean {
  return imageString.split(':')[0] in digitalOceanDatabaseConfig.databases;
}

export function getDatabaseConfig(imageString: string): DatabaseConfig | null {
  const baseImage = imageString.split(':')[0];
  return digitalOceanDatabaseConfig.databases[baseImage] || null;
}

export type { DatabaseConfig, DigitalOceanDatabaseConfig };
