import { describe, test, expect, vi } from 'vitest';
import { 
  servicePropertyMappings, 
  databasePropertyMappings, 
  getPropertyForProvider 
} from '../../../src/config/connection-properties';

describe('connection-properties', () => {
  describe('servicePropertyMappings', () => {
    test('should have correct mapping for host property', () => {
      expect(servicePropertyMappings.host).toEqual({
        render: 'host',
        digitalOcean: 'PRIVATE_DOMAIN'
      });
    });

    test('should have correct mapping for port property', () => {
      expect(servicePropertyMappings.port).toEqual({
        render: 'port',
        digitalOcean: 'PRIVATE_PORT'
      });
    });

    test('should have correct mapping for hostport property', () => {
      expect(servicePropertyMappings.hostport).toEqual({
        render: 'hostport',
        digitalOcean: 'PRIVATE_URL'
      });
    });
  });

  describe('databasePropertyMappings', () => {
    test('should have correct mapping for connectionString property', () => {
      expect(databasePropertyMappings.connectionString).toEqual({
        render: 'connectionString',
        digitalOcean: 'DATABASE_URL'
      });
    });

    test('should have correct mapping for username property', () => {
      expect(databasePropertyMappings.username).toEqual({
        render: 'user',
        digitalOcean: 'USERNAME'
      });
    });

    test('should have correct mapping for password property', () => {
      expect(databasePropertyMappings.password).toEqual({
        render: 'password',
        digitalOcean: 'PASSWORD'
      });
    });

    test('should have correct mapping for databaseName property', () => {
      expect(databasePropertyMappings.databaseName).toEqual({
        render: 'database',
        digitalOcean: 'DATABASE'
      });
    });
  });

  describe('getPropertyForProvider', () => {
    test('should return correct property for Render service properties', () => {
      expect(getPropertyForProvider('host', 'render', false)).toBe('host');
      expect(getPropertyForProvider('port', 'render', false)).toBe('port');
      expect(getPropertyForProvider('hostport', 'render', false)).toBe('hostport');
    });

    test('should return correct property for DigitalOcean service properties', () => {
      expect(getPropertyForProvider('host', 'digitalOcean', false)).toBe('PRIVATE_DOMAIN');
      expect(getPropertyForProvider('port', 'digitalOcean', false)).toBe('PRIVATE_PORT');
      expect(getPropertyForProvider('hostport', 'digitalOcean', false)).toBe('PRIVATE_URL');
    });

    test('should return correct property for Render database properties', () => {
      expect(getPropertyForProvider('connectionString', 'render', true)).toBe('connectionString');
      expect(getPropertyForProvider('username', 'render', true)).toBe('user');
      expect(getPropertyForProvider('password', 'render', true)).toBe('password');
      expect(getPropertyForProvider('databaseName', 'render', true)).toBe('database');
    });

    test('should return correct property for DigitalOcean database properties', () => {
      expect(getPropertyForProvider('connectionString', 'digitalOcean', true)).toBe('DATABASE_URL');
      expect(getPropertyForProvider('username', 'digitalOcean', true)).toBe('USERNAME');
      expect(getPropertyForProvider('password', 'digitalOcean', true)).toBe('PASSWORD');
      expect(getPropertyForProvider('databaseName', 'digitalOcean', true)).toBe('DATABASE');
    });

    test('should handle unknown properties', () => {
      // Create a spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Test with unknown property
      const result = getPropertyForProvider('unknownProperty', 'render', false);
      
      // Verify console warning was called
      expect(warnSpy).toHaveBeenCalledWith('Unknown property: unknownProperty. Using as-is.');
      
      // Verify original property is returned
      expect(result).toBe('unknownProperty');
      
      // Restore console.warn
      warnSpy.mockRestore();
    });

    test('should use passed property as fallback', () => {
      // This tests the behavior where if the property doesn't exist in the mapping
      // it should return the original property
      expect(getPropertyForProvider('custom', 'render', false)).toBe('custom');
      expect(getPropertyForProvider('custom', 'digitalOcean', true)).toBe('custom');
    });
  });
});
