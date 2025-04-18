import { describe, test, expect } from 'vitest';
import { normalizeVolume } from '../../../src/utils/normalizeVolume';

describe('normalizeVolume', () => {
  test('should normalize simple path as both host and container', () => {
    const result = normalizeVolume('/data');
    
    expect(result).toEqual({
      host: '/data',
      container: '/data'
    });
  });

  test('should normalize host:container format', () => {
    const result = normalizeVolume('/host/path:/container/path');
    
    expect(result).toEqual({
      host: '/host/path',
      container: '/container/path'
    });
  });

  test('should normalize host:container:mode format', () => {
    const result = normalizeVolume('/host/path:/container/path:ro');
    
    expect(result).toEqual({
      host: '/host/path',
      container: '/container/path',
      mode: 'ro'
    });
  });

  test('should normalize paths with $HOME environment variable', () => {
    const result = normalizeVolume('$HOME/data:/app/data');
    
    expect(result).toEqual({
      host: './data',
      container: '/app/data'
    });
  });

  test('should normalize paths with ${HOME} environment variable', () => {
    const result = normalizeVolume('${HOME}/data:/app/data');
    
    expect(result).toEqual({
      host: './data',
      container: '/app/data'
    });
  });

  test('should normalize paths with ~/ as home directory', () => {
    const result = normalizeVolume('~/data:/app/data');
    
    expect(result).toEqual({
      host: './data',
      container: '/app/data'
    });
  });

  test('should handle named volumes', () => {
    const result = normalizeVolume('volume_name:/container/path');
    
    expect(result).toEqual({
      host: 'volume_name',
      container: '/container/path'
    });
  });

  test('should handle named volumes with mode', () => {
    const result = normalizeVolume('volume_name:/container/path:rw');
    
    expect(result).toEqual({
      host: 'volume_name',
      container: '/container/path',
      mode: 'rw'
    });
  });

  test('should handle relative paths', () => {
    const result = normalizeVolume('./data:/app/data');
    
    expect(result).toEqual({
      host: './data',
      container: '/app/data'
    });
  });

  test('should handle multiple environment variables in path', () => {
    const result = normalizeVolume('$HOME/data/${PROJECT_NAME}:/app/data');
    
    expect(result).toEqual({
      host: './data/${PROJECT_NAME}',
      container: '/app/data'
    });
  });
});
