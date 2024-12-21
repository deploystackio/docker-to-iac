import { ApplicationConfig } from '../types/container-config';
import { EnvironmentVariableGenerationConfig } from '../types/environment-config';

export class SourceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceValidationError';
  }
}

export interface EnvironmentOptions {
  environmentGeneration?: EnvironmentVariableGenerationConfig;
  environmentVariables?: Record<string, string>;
  getPersistedEnvVars?: (serviceName: string, imageConfig: any) => Record<string, string>;
  setPersistedEnvVars?: (serviceName: string, vars: Record<string, string>) => void;
}

export interface SourceParser {
  parse(content: string, environmentOptions?: EnvironmentOptions): ApplicationConfig;
  validate(content: string): boolean;
}
