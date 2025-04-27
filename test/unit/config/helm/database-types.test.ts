import { describe, test, expect } from 'vitest';
import { 
  helmDatabaseConfig, 
  isDatabaseService, 
  getDatabaseConfig, 
  DatabaseConfig 
} from '../../../../src/config/helm/database-types';

describe('helmDatabaseConfig', () => {
  test('should contain expected database configurations', () => {
    expect(helmDatabaseConfig).toHaveProperty('databases');
    
    // Check if all expected database types are defined
    const expectedDatabases = [
      'docker.io/library/mysql',
      'docker.io/library/mariadb',
      'docker.io/library/postgres',
      'docker.io/library/redis',
      'docker.io/library/mongodb'
    ];
    
    expectedDatabases.forEach(dbType => {
      expect(helmDatabaseConfig.databases).toHaveProperty(dbType);
    });
  });

  test('each database configuration should have required properties', () => {
    Object.values(helmDatabaseConfig.databases).forEach((config: DatabaseConfig) => {
      expect(config).toHaveProperty('chart');
      expect(config).toHaveProperty('repository');
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('portNumber');
      expect(config).toHaveProperty('connectionTemplate');
      expect(config).toHaveProperty('valueTemplate');
    });
  });

  test('mysql configuration should be correctly defined', () => {
    const mysqlConfig = helmDatabaseConfig.databases['docker.io/library/mysql'];
    
    expect(mysqlConfig.chart).toBe('mysql');
    expect(mysqlConfig.repository).toBe('https://charts.bitnami.com/bitnami');
    expect(mysqlConfig.version).toBe('^9.0.0');
    expect(mysqlConfig.portNumber).toBe(3306);
    expect(mysqlConfig.connectionTemplate).toBe('mysql://{{username}}:{{password}}@{{host}}:{{port}}/{{database}}');
    
    // Test valueTemplate structure
    expect(mysqlConfig.valueTemplate).toHaveProperty('auth');
    expect(mysqlConfig.valueTemplate.auth).toHaveProperty('rootPassword');
    expect(mysqlConfig.valueTemplate.auth).toHaveProperty('database');
    expect(mysqlConfig.valueTemplate.auth).toHaveProperty('username');
    expect(mysqlConfig.valueTemplate.auth).toHaveProperty('password');
    
    expect(mysqlConfig.valueTemplate).toHaveProperty('primary');
    expect(mysqlConfig.valueTemplate.primary).toHaveProperty('service');
    expect(mysqlConfig.valueTemplate.primary).toHaveProperty('persistence');
    expect(mysqlConfig.valueTemplate.primary.persistence.enabled).toBe(true);
  });

  test('postgres configuration should be correctly defined', () => {
    const postgresConfig = helmDatabaseConfig.databases['docker.io/library/postgres'];
    
    expect(postgresConfig.chart).toBe('postgresql');
    expect(postgresConfig.repository).toBe('https://charts.bitnami.com/bitnami');
    expect(postgresConfig.version).toBe('^12.0.0');
    expect(postgresConfig.portNumber).toBe(5432);
    expect(postgresConfig.connectionTemplate).toBe('postgresql://{{username}}:{{password}}@{{host}}:{{port}}/{{database}}');
  });
});

describe('isDatabaseService', () => {
  test('should return true for supported database images', () => {
    expect(isDatabaseService('docker.io/library/mysql:latest')).toBe(true);
    expect(isDatabaseService('docker.io/library/postgres:13')).toBe(true);
    expect(isDatabaseService('docker.io/library/mariadb:10.5')).toBe(true);
    expect(isDatabaseService('docker.io/library/redis:alpine')).toBe(true);
    expect(isDatabaseService('docker.io/library/mongodb:4.4')).toBe(true);
  });

  test('should return false for unsupported database images', () => {
    expect(isDatabaseService('docker.io/library/nginx:latest')).toBe(false);
    expect(isDatabaseService('custom/cassandra:latest')).toBe(false);
    expect(isDatabaseService('unknown-db:1.0')).toBe(false);
  });

  test('should handle image strings without tags', () => {
    expect(isDatabaseService('docker.io/library/mysql')).toBe(true);
    expect(isDatabaseService('docker.io/library/nginx')).toBe(false);
  });
});

describe('getDatabaseConfig', () => {
  test('should return correct configuration for supported database images', () => {
    const mysqlConfig = getDatabaseConfig('docker.io/library/mysql:latest');
    expect(mysqlConfig).not.toBeNull();
    expect(mysqlConfig?.chart).toBe('mysql');
    expect(mysqlConfig?.portNumber).toBe(3306);

    const redisConfig = getDatabaseConfig('docker.io/library/redis:6.2');
    expect(redisConfig).not.toBeNull();
    expect(redisConfig?.chart).toBe('redis');
    expect(redisConfig?.portNumber).toBe(6379);
  });

  test('should return null for unsupported database images', () => {
    expect(getDatabaseConfig('docker.io/library/nginx:latest')).toBeNull();
    expect(getDatabaseConfig('custom/cassandra:latest')).toBeNull();
  });

  test('should handle image strings without tags', () => {
    const postgresConfig = getDatabaseConfig('docker.io/library/postgres');
    expect(postgresConfig).not.toBeNull();
    expect(postgresConfig?.chart).toBe('postgresql');

    expect(getDatabaseConfig('docker.io/library/nginx')).toBeNull();
  });
});
