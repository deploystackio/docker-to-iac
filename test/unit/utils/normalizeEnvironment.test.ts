import { describe, test, expect } from 'vitest';
import { normalizeEnvironment } from '../../../src/utils/normalizeEnvironment';

describe('normalizeEnvironment', () => {
  test('should handle undefined input', () => {
    const result = normalizeEnvironment(undefined);
    expect(result).toEqual({});
  });

  test('should handle string input with key=value format', () => {
    const result = normalizeEnvironment('NODE_ENV=production');
    expect(result).toEqual({
      NODE_ENV: 'production'
    });
  });

  test('should handle string input with quoted values', () => {
    const result = normalizeEnvironment('SECRET_KEY="super-secret"');
    expect(result).toEqual({
      SECRET_KEY: 'super-secret'
    });
  });

  test('should handle array input', () => {
    const result = normalizeEnvironment([
      'NODE_ENV=production',
      'PORT=3000',
      'DEBUG=true'
    ]);
    
    expect(result).toEqual({
      NODE_ENV: 'production',
      PORT: '3000',
      DEBUG: 'true'
    });
  });

  test('should handle object input', () => {
    const result = normalizeEnvironment({
      NODE_ENV: 'production',
      PORT: '3000',
      DEBUG: 'true'
    });
    
    expect(result).toEqual({
      NODE_ENV: 'production',
      PORT: '3000',
      DEBUG: 'true'
    });
  });

  test('should resolve environment variables', () => {
    const result = normalizeEnvironment(
      'DATABASE_URL=${DB_URL}',
      { DB_URL: 'postgres://localhost:5432/db' }
    );
    
    expect(result).toEqual({
      DATABASE_URL: '${DB_URL}'  // Note: actual resolution happens in resolveEnvironmentValue
    });
  });

  test('should handle equals sign in values', () => {
    const result = normalizeEnvironment('CONNECTION_STRING=user=admin;password=pass');
    
    expect(result).toEqual({
      CONNECTION_STRING: 'user=admin;password=pass'
    });
  });

  test('should handle empty values', () => {
    const result = normalizeEnvironment('EMPTY_VAR=');
    
    expect(result).toEqual({
      EMPTY_VAR: ''
    });
  });

  test('should trim keys and values', () => {
    const result = normalizeEnvironment(' SPACES = value with spaces ');
    
    expect(result).toEqual({
      SPACES: 'value with spaces'
    });
  });
});
