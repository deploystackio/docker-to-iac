import { describe, test, expect } from 'vitest';
import { createSourceParser } from '../../../src/sources/factory';
import { ComposeParser } from '../../../src/sources/compose';
import { RunCommandParser } from '../../../src/sources/run';
import { SourceParser } from '../../../src/sources/base';

describe('createSourceParser', () => {
  test('should create a ComposeParser when type is compose', () => {
    const parser = createSourceParser('compose');
    
    expect(parser).toBeInstanceOf(ComposeParser);
    expect(parser).toBeInstanceOf(Object);
    expect(parser).toHaveProperty('parse');
    expect(parser).toHaveProperty('validate');
  });

  test('should create a RunCommandParser when type is run', () => {
    const parser = createSourceParser('run');
    
    expect(parser).toBeInstanceOf(RunCommandParser);
    expect(parser).toBeInstanceOf(Object);
    expect(parser).toHaveProperty('parse');
    expect(parser).toHaveProperty('validate');
  });

  test('should throw an error for unsupported source type', () => {
    // Using type assertion to bypass TypeScript's type checking
    // In a real scenario, this might happen if the factory is called with a user-provided value
    expect(() => 
      createSourceParser('unsupported' as 'compose' | 'run')
    ).toThrow('Unsupported source type: unsupported');
  });

  test('should return objects that implement SourceParser interface', () => {
    const composeParser = createSourceParser('compose');
    const runParser = createSourceParser('run');
    
    // Verify both parsers implement the required interface methods
    expect(typeof composeParser.parse).toBe('function');
    expect(typeof composeParser.validate).toBe('function');
    
    expect(typeof runParser.parse).toBe('function');
    expect(typeof runParser.validate).toBe('function');
    
    // Verify the returned objects can be typed as SourceParser
    const assertParser = (parser: SourceParser): void => {
      expect(parser).toBeDefined();
    };
    
    assertParser(composeParser);
    assertParser(runParser);
  });
});