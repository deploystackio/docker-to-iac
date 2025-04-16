import { describe, test, expect } from 'vitest';
import { 
  digitalOceanDatabaseConfig,
  isDatabaseService,
  getDatabaseConfig
} from '../../../../src/config/digitalocean/database-types';

describe('digitalocean/database-types', () => {
  describe('digitalOceanDatabaseConfig', () => {
    test('should have MySQL database configuration', () => {
      const mysqlConfig = digitalOceanDatabaseConfig.databases['docker.io/library/mysql'];
      
      expect(mysqlConfig).toBeDefined();
      expect(mysqlConfig.engine).toBe('MYSQL');
      expect(mysqlConfig.portNumber).toBe(3306);
    });

    test('should have MariaDB database configuration', () => {
      const mariadbConfig = digitalOceanDatabaseConfig.databases['docker.io/library/mariadb'];
      
      expect(mariadbConfig).toBeDefined();
      expect(mariadbConfig.engine).toBe('MYSQL');
      expect(mariadbConfig.portNumber).toBe(3306);
    });

    test('should have PostgreSQL database configuration', () => {
      const postgresConfig = digitalOceanDatabaseConfig.databases['docker.io/library/postgres'];
      
      expect(postgresConfig).toBeDefined();
      expect(postgresConfig.engine).toBe('PG');
      expect(postgresConfig.portNumber).toBe(5432);
      expect(postgresConfig.isManaged).toBe(true);
    });

    test('should have Redis database configuration', () => {
      const redisConfig = digitalOceanDatabaseConfig.databases['docker.io/library/redis'];
      
      expect(redisConfig).toBeDefined();
      expect(redisConfig.engine).toBe('REDIS');
      expect(redisConfig.portNumber).toBe(6379);
    });

    test('should have MongoDB database configuration', () => {
      const mongodbConfig = digitalOceanDatabaseConfig.databases['docker.io/library/mongodb'];
      
      expect(mongodbConfig).toBeDefined();
      expect(mongodbConfig.engine).toBe('MONGODB');
      expect(mongodbConfig.portNumber).toBe(27017);
    });
  });

  describe('isDatabaseService', () => {
    test('should return true for MySQL images', () => {
      expect(isDatabaseService('docker.io/library/mysql:latest')).toBe(true);
      expect(isDatabaseService('docker.io/library/mysql:5.7')).toBe(true);
    });

    test('should return true for MariaDB images', () => {
      expect(isDatabaseService('docker.io/library/mariadb:latest')).toBe(true);
      expect(isDatabaseService('docker.io/library/mariadb:10.5')).toBe(true);
    });

    test('should return true for PostgreSQL images', () => {
      expect(isDatabaseService('docker.io/library/postgres:latest')).toBe(true);
      expect(isDatabaseService('docker.io/library/postgres:13')).toBe(true);
    });

    test('should return true for Redis images', () => {
      expect(isDatabaseService('docker.io/library/redis:latest')).toBe(true);
      expect(isDatabaseService('docker.io/library/redis:alpine')).toBe(true);
    });

    test('should return true for MongoDB images', () => {
      expect(isDatabaseService('docker.io/library/mongodb:latest')).toBe(true);
    });

    test('should return false for non-database images', () => {
      expect(isDatabaseService('docker.io/library/nginx:latest')).toBe(false);
      expect(isDatabaseService('docker.io/library/node:14')).toBe(false);
      expect(isDatabaseService('custom/image:latest')).toBe(false);
    });
  });

  describe('getDatabaseConfig', () => {
    test('should return MySQL config for MySQL images', () => {
      const config = getDatabaseConfig('docker.io/library/mysql:latest');
      
      expect(config).toBeDefined();
      expect(config?.engine).toBe('MYSQL');
      expect(config?.portNumber).toBe(3306);
    });

    test('should return MariaDB config for MariaDB images', () => {
      const config = getDatabaseConfig('docker.io/library/mariadb:latest');
      
      expect(config).toBeDefined();
      expect(config?.engine).toBe('MYSQL');
      expect(config?.portNumber).toBe(3306);
    });

    test('should return PostgreSQL config for PostgreSQL images', () => {
      const config = getDatabaseConfig('docker.io/library/postgres:latest');
      
      expect(config).toBeDefined();
      expect(config?.engine).toBe('PG');
      expect(config?.portNumber).toBe(5432);
      expect(config?.isManaged).toBe(true);
    });

    test('should return null for non-database images', () => {
      expect(getDatabaseConfig('docker.io/library/nginx:latest')).toBeNull();
      expect(getDatabaseConfig('custom/image:latest')).toBeNull();
    });

    test('should handle version tags correctly', () => {
      // Make sure version tags don't affect the result
      const config1 = getDatabaseConfig('docker.io/library/mysql:latest');
      const config2 = getDatabaseConfig('docker.io/library/mysql:5.7');
      
      expect(config1).toEqual(config2);
    });

    test('should handle image strings without tags', () => {
      const config = getDatabaseConfig('docker.io/library/postgres');
      
      expect(config).toBeDefined();
      expect(config?.engine).toBe('PG');
    });
  });
});
