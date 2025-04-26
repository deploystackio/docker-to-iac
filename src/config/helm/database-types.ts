interface DatabaseConfig {
  chart: string; 
  repository: string;
  version: string;
  portNumber: number;
  connectionTemplate: string;
  valueTemplate: {
    [key: string]: any;
  };
}

interface HelmDatabaseConfig {
  databases: {
    [key: string]: DatabaseConfig;
  };
}

export const helmDatabaseConfig: HelmDatabaseConfig = {
  databases: {
    'docker.io/library/mysql': {
      chart: 'mysql',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '^9.0.0',
      portNumber: 3306,
      connectionTemplate: 'mysql://{{username}}:{{password}}@{{host}}:{{port}}/{{database}}',
      valueTemplate: {
        auth: {
          rootPassword: '${MYSQL_ROOT_PASSWORD}',
          database: '${MYSQL_DATABASE}',
          username: '${MYSQL_USER}',
          password: '${MYSQL_PASSWORD}'
        },
        primary: {
          service: {
            ports: {
              mysql: 3306
            }
          },
          persistence: {
            enabled: true,
            size: '8Gi'
          }
        }
      }
    },
    'docker.io/library/mariadb': {
      chart: 'mariadb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '^11.0.0',
      portNumber: 3306,
      connectionTemplate: 'mysql://{{username}}:{{password}}@{{host}}:{{port}}/{{database}}',
      valueTemplate: {
        auth: {
          rootPassword: '${MARIADB_ROOT_PASSWORD}',
          database: '${MARIADB_DATABASE}',
          username: '${MARIADB_USER}',
          password: '${MARIADB_PASSWORD}'
        },
        primary: {
          service: {
            ports: {
              mysql: 3306
            }
          },
          persistence: {
            enabled: true,
            size: '8Gi'
          }
        }
      }
    },
    'docker.io/library/postgres': {
      chart: 'postgresql',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '^12.0.0',
      portNumber: 5432,
      connectionTemplate: 'postgresql://{{username}}:{{password}}@{{host}}:{{port}}/{{database}}',
      valueTemplate: {
        auth: {
          postgres: {
            password: '${POSTGRES_PASSWORD}'
          },
          database: '${POSTGRES_DB}',
          username: '${POSTGRES_USER}',
          password: '${POSTGRES_PASSWORD}'
        },
        primary: {
          service: {
            ports: {
              postgresql: 5432
            }
          },
          persistence: {
            enabled: true,
            size: '8Gi'
          }
        }
      }
    },
    'docker.io/library/redis': {
      chart: 'redis',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '^17.0.0',
      portNumber: 6379,
      connectionTemplate: 'redis://{{username}}:{{password}}@{{host}}:{{port}}',
      valueTemplate: {
        auth: {
          enabled: true,
          password: '${REDIS_PASSWORD}'
        },
        master: {
          service: {
            ports: {
              redis: 6379
            }
          },
          persistence: {
            enabled: true,
            size: '8Gi'
          }
        }
      }
    },
    'docker.io/library/mongodb': {
      chart: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '^13.0.0',
      portNumber: 27017,
      connectionTemplate: 'mongodb://{{username}}:{{password}}@{{host}}:{{port}}/{{database}}',
      valueTemplate: {
        auth: {
          rootPassword: '${MONGODB_ROOT_PASSWORD}',
          database: '${MONGODB_DATABASE}',
          username: '${MONGODB_USERNAME}',
          password: '${MONGODB_PASSWORD}'
        },
        service: {
          ports: {
            mongodb: 27017
          }
        },
        persistence: {
          enabled: true,
          size: '8Gi'
        }
      }
    }
  }
};

export function isDatabaseService(imageString: string): boolean {
  return imageString.split(':')[0] in helmDatabaseConfig.databases;
}

export function getDatabaseConfig(imageString: string): DatabaseConfig | null {
  const baseImage = imageString.split(':')[0];
  return helmDatabaseConfig.databases[baseImage] || null;
}

export type { DatabaseConfig, HelmDatabaseConfig };
