import { describe, test, expect, vi } from 'vitest';
import { getServiceNameTransformer } from '../../../src/utils/serviceNameTransformers';

// Mock the digitalOceanParserServiceName module
vi.mock('../../../src/utils/digitalOceanParserServiceName', () => ({
  digitalOceanParserServiceName: vi.fn((name) => `do-${name}`)
}));

// Import the mocked function
import { digitalOceanParserServiceName } from '../../../src/utils/digitalOceanParserServiceName';

describe('getServiceNameTransformer', () => {
  test('should return digitalOcean transformer when specified', () => {
    const transformer = getServiceNameTransformer('digitalOcean');
    
    // Execute the transformer to verify it calls the right function
    const result = transformer('my-service');
    
    expect(result).toBe('do-my-service');
    expect(digitalOceanParserServiceName).toHaveBeenCalledWith('my-service');
  });

  test('should return default transformer when no name specified', () => {
    const transformer = getServiceNameTransformer();
    
    // Default transformer should return input unchanged
    const result = transformer('my-service');
    
    expect(result).toBe('my-service');
  });

  test('should return default transformer for unknown transformer name', () => {
    const transformer = getServiceNameTransformer('nonexistent');
    
    // Default transformer should return input unchanged
    const result = transformer('my-service');
    
    expect(result).toBe('my-service');
  });

  test('should handle empty service name', () => {
    const transformer = getServiceNameTransformer('digitalOcean');
    
    transformer('');
    
    expect(digitalOceanParserServiceName).toHaveBeenCalledWith('');
  });

  test('should handle special characters in service name', () => {
    const transformer = getServiceNameTransformer('digitalOcean');
    
    transformer('my_service@special');
    
    expect(digitalOceanParserServiceName).toHaveBeenCalledWith('my_service@special');
  });

  test('should handle default transformer with various inputs', () => {
    const transformer = getServiceNameTransformer('default');
    
    expect(transformer('my-service')).toBe('my-service');
    expect(transformer('')).toBe('');
    expect(transformer('MY_SERVICE')).toBe('MY_SERVICE');
    expect(transformer('service-123')).toBe('service-123');
  });
});
