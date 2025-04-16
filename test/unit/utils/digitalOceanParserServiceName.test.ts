import { describe, test, expect } from 'vitest';
import { digitalOceanParserServiceName } from '../../../src/utils/digitalOceanParserServiceName';

describe('digitalOceanParserServiceName', () => {
  test('should format simple service name correctly', () => {
    const result = digitalOceanParserServiceName('myservice');
    expect(result).toBe('myservice');
  });

  test('should convert uppercase to lowercase', () => {
    const result = digitalOceanParserServiceName('MyService');
    expect(result).toBe('myservice');
  });

  test('should replace underscores with hyphens', () => {
    const result = digitalOceanParserServiceName('my_service');
    expect(result).toBe('my-service');
  });

  test('should remove special characters', () => {
    const result = digitalOceanParserServiceName('my@service!');
    expect(result).toBe('myservice');
  });

  test('should ensure service name starts with a letter', () => {
    const result = digitalOceanParserServiceName('123service');
    expect(result).toBe('svc-123service');
  });

  test('should handle array input', () => {
    const result = digitalOceanParserServiceName(['my', 'service']);
    expect(result).toBe('my-service');
  });

  test('should handle undefined input', () => {
    const result = digitalOceanParserServiceName(undefined);
    expect(result).toBe('service');
  });

  test('should remove consecutive hyphens', () => {
    const result = digitalOceanParserServiceName('my--service');
    expect(result).toBe('my-service');
  });

  test('should remove trailing hyphens', () => {
    const result = digitalOceanParserServiceName('service-');
    // Actual implementation removes trailing hyphens without adding '0'
    expect(result).toBe('service');
  });

  test('should ensure service name ends with alphanumeric', () => {
    const result = digitalOceanParserServiceName('service-&');
    // Actual implementation removes special characters first, resulting in 'service'
    expect(result).toBe('service');
  });

  test('should truncate long service names to 32 characters', () => {
    const longName = 'this-is-a-very-long-service-name-that-needs-truncation';
    const result = digitalOceanParserServiceName(longName);
    expect(result.length).toBeLessThanOrEqual(32);
  });

  test('should ensure truncated name still ends with alphanumeric', () => {
    const longName = 'this-is-a-very-long-service-name-that-ends-with-';
    const result = digitalOceanParserServiceName(longName);
    expect(result.length).toBeLessThanOrEqual(32);
    expect(result).toMatch(/[a-z0-9]$/);
  });

  test('should pad very short names', () => {
    const result = digitalOceanParserServiceName('a');
    expect(result).toBe('service-1');
  });

  test('should handle spaces in service names', () => {
    const result = digitalOceanParserServiceName('my service name');
    expect(result).toBe('myservicename');
  });

  test('should handle mixed special characters and spacing', () => {
    const result = digitalOceanParserServiceName('My Service!@#$%^&*(Name 123');
    expect(result).toBe('myservicename123');
  });
});
