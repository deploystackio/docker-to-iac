import { describe, test, expect } from 'vitest';
import { parseCommand } from '../../../src/utils/parseCommand';

describe('parseCommand', () => {
  test('should handle string command', () => {
    const result = parseCommand('node server.js');
    expect(result).toBe('node server.js');
  });

  test('should handle array command', () => {
    const result = parseCommand(['node', 'server.js', '--port=3000']);
    expect(result).toBe('node server.js --port=3000');
  });

  test('should handle empty string', () => {
    const result = parseCommand('');
    expect(result).toBe('');
  });

  test('should handle undefined', () => {
    const result = parseCommand(undefined);
    expect(result).toBe('');
  });

  test('should handle command with special characters', () => {
    const result = parseCommand('sh -c "echo hello && npm start"');
    expect(result).toBe('sh -c "echo hello && npm start"');
  });

  test('should handle array with empty elements', () => {
    const result = parseCommand(['npm', 'start', '', 'ignored']);
    expect(result).toBe('npm start  ignored');
  });

  test('should handle array with mixed types', () => {
    // This test ensures that the command handles non-string array elements
    // by converting them to strings
    const result = parseCommand(['npm', 'start', '--port=', 3000] as any);
    expect(result).toBe('npm start --port= 3000');
  });

  test('should handle multi-line command string', () => {
    const result = parseCommand(`npm start
    --port=3000
    --env=production`);
    expect(result).toBe(`npm start
    --port=3000
    --env=production`);
  });
});
