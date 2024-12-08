import { SourceParser } from './base';
import { ComposeParser } from './compose';
import { RunCommandParser } from './run';

export function createSourceParser(type: 'compose' | 'run'): SourceParser {
  switch (type) {
    case 'compose':
      return new ComposeParser();
    case 'run':
      return new RunCommandParser();
    default:
      throw new Error(`Unsupported source type: ${type}`);
  }
}
