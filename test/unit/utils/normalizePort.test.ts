import { describe, test, expect } from 'vitest';
import { normalizePort } from '../../../src/utils/normalizePort';

describe('normalizePort', () => {
  test('should normalize simple port mapping', () => {
    const result = normalizePort('8080:80');
    
    expect(result).toEqual({
      host: 8080,
      container: 80
    });
  });

  test('should normalize single port', () => {
    const result = normalizePort('8080');
    
    expect(result).toEqual({
      host: 8080,
      container: 8080
    });
  });

  test('should normalize port with protocol', () => {
    const result = normalizePort('8080:80/tcp');
    
    expect(result).toEqual({
      host: 8080,
      container: 80,
      protocol: 'tcp'
    });
  });

  test('should normalize port with IP address', () => {
    const result = normalizePort('127.0.0.1:8080:80');
    
    expect(result).toEqual({
      host: 8080,
      container: 80
    });
  });

  test('should normalize port with environment variable and default value', () => {
    const result = normalizePort('${PORT:-8080}:80');
    
    expect(result).toEqual({
      host: 8080,
      container: 80
    });
  });

  test('should handle negative numbers by using absolute value', () => {
    const result = normalizePort('-8080:-80');
    
    expect(result).toEqual({
      host: 8080,
      container: 80
    });
  });

  test('should handle port with protocol in different format', () => {
    const result = normalizePort('8080:80/udp');
    
    expect(result).toEqual({
      host: 8080,
      container: 80,
      protocol: 'udp'
    });
  });

  test('should handle complex port mapping', () => {
    const result = normalizePort('127.0.0.1:${PORT:-8080}:80/tcp');
    
    expect(result).toEqual({
      host: 8080,
      container: 80,
      protocol: 'tcp'
    });
  });
});
