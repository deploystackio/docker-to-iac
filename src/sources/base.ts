import { ApplicationConfig } from '../types/container-config';

export interface SourceParser {
  parse(content: string): ApplicationConfig;
  validate(content: string): boolean;
}

export class SourceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceValidationError';
  }
}
