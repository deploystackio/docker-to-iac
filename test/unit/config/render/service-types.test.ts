import { describe, test, expect } from 'vitest';
import { renderServiceTypesConfig } from '../../../../src/config/render/service-types';

describe('render/service-types', () => {
  describe('renderServiceTypesConfig', () => {
    test('should have MariaDB service configuration', () => {
      const mariadbConfig = renderServiceTypesConfig.serviceTypes['docker.io/library/mariadb'];
      
      expect(mariadbConfig).toBeDefined();
      expect(mariadbConfig.type).toBe('pserv');
      expect(mariadbConfig.versions).toBe('*');
      expect(mariadbConfig.isManaged).toBeUndefined();
    });

    test('should have MySQL service configuration', () => {
      const mysqlConfig = renderServiceTypesConfig.serviceTypes['docker.io/library/mysql'];
      
      expect(mysqlConfig).toBeDefined();
      expect(mysqlConfig.type).toBe('pserv');
      expect(mysqlConfig.versions).toBe('*');
      expect(mysqlConfig.isManaged).toBeUndefined();
    });

    test('should have PostgreSQL service configuration', () => {
      const postgresConfig = renderServiceTypesConfig.serviceTypes['docker.io/library/postgres'];
      
      expect(postgresConfig).toBeDefined();
      expect(postgresConfig.type).toBe('database');
      expect(postgresConfig.versions).toBe('*');
      expect(postgresConfig.isManaged).toBe(true);
    });

    test('should have Redis service configuration', () => {
      const redisConfig = renderServiceTypesConfig.serviceTypes['docker.io/library/redis'];
      
      expect(redisConfig).toBeDefined();
      expect(redisConfig.type).toBe('redis');
      expect(redisConfig.versions).toBe('*');
      expect(redisConfig.isManaged).toBe(true);
    });

    test('should classify databases and caches correctly', () => {
      // Get all service types
      const serviceTypes = renderServiceTypesConfig.serviceTypes;
      
      // Check database types
      expect(serviceTypes['docker.io/library/postgres'].type).toBe('database');
      
      // Check redis type
      expect(serviceTypes['docker.io/library/redis'].type).toBe('redis');
      
      // Check private service types
      expect(serviceTypes['docker.io/library/mariadb'].type).toBe('pserv');
      expect(serviceTypes['docker.io/library/mysql'].type).toBe('pserv');
    });

    test('should set managed flag correctly', () => {
      const serviceTypes = renderServiceTypesConfig.serviceTypes;
      
      // Managed services
      expect(serviceTypes['docker.io/library/postgres'].isManaged).toBe(true);
      expect(serviceTypes['docker.io/library/redis'].isManaged).toBe(true);
      
      // Non-managed services
      expect(serviceTypes['docker.io/library/mariadb'].isManaged).toBeUndefined();
      expect(serviceTypes['docker.io/library/mysql'].isManaged).toBeUndefined();
    });

    test('should set version matching to wildcard for all services', () => {
      // Get all service types
      const serviceTypes = renderServiceTypesConfig.serviceTypes;
      
      // Check that all services use wildcard version
      Object.values(serviceTypes).forEach(config => {
        expect(config.versions).toBe('*');
      });
    });

    test('should have descriptive text for all service types', () => {
      // Get all service types
      const serviceTypes = renderServiceTypesConfig.serviceTypes;
      
      // Check that all services have non-empty descriptions
      Object.values(serviceTypes).forEach(config => {
        expect(config.description).toBeDefined();
        expect(config.description.length).toBeGreaterThan(0);
      });
    });
  });
});
