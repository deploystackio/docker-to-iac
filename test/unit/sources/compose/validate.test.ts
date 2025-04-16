import { describe, test, expect } from 'vitest';
import { validateDockerCompose } from '../../../../src/sources/compose/validate';
import { SourceValidationError } from '../../../../src/sources/base';

describe('validateDockerCompose', () => {
  test('should validate a valid docker-compose configuration', () => {
    const validConfig = {
      services: {
        webapp: {
          image: 'nginx:latest',
          ports: ['80:80'],
          environment: {
            NODE_ENV: 'production'
          }
        },
        database: {
          image: 'postgres:13',
          volumes: ['pgdata:/var/lib/postgresql/data']
        }
      }
    };

    // Should not throw any error
    expect(() => validateDockerCompose(validConfig)).not.toThrow();
  });

  test('should validate a minimal docker-compose configuration', () => {
    const minimalConfig = {
      services: {
        app: {
          image: 'alpine:latest'
        }
      }
    };

    // Should not throw any error
    expect(() => validateDockerCompose(minimalConfig)).not.toThrow();
  });

  test('should throw error when no services are defined', () => {
    const emptyServicesConfig = {
      services: {}
    };

    expect(() => validateDockerCompose(emptyServicesConfig))
      .toThrow(SourceValidationError);
    
    expect(() => validateDockerCompose(emptyServicesConfig))
      .toThrow('No services found in docker-compose file');
  });

  test('should throw error when services is missing', () => {
    const missingServicesConfig = {} as any;

    expect(() => validateDockerCompose(missingServicesConfig))
      .toThrow(SourceValidationError);
    
    expect(() => validateDockerCompose(missingServicesConfig))
      .toThrow('No services found in docker-compose file');
  });

  test('should throw error when a service does not have an image', () => {
    const missingImageConfig = {
      services: {
        webapp: {
          image: 'nginx:latest'
        },
        database: {
          // missing image
          ports: ['5432:5432']
        } as any // Type assertion to bypass TypeScript checking
      }
    };

    expect(() => validateDockerCompose(missingImageConfig))
      .toThrow(SourceValidationError);
    
    // Use a regex pattern to match part of the error message to be more flexible
    expect(() => validateDockerCompose(missingImageConfig))
      .toThrow(/Service 'database' does not have an image specified/);
  });

  test('should throw error when a service has an empty image', () => {
    const emptyImageConfig = {
      services: {
        webapp: {
          image: ''  // empty image
        }
      }
    };

    expect(() => validateDockerCompose(emptyImageConfig))
      .toThrow(SourceValidationError);
    
    // Use a regex pattern to match part of the error message to be more flexible
    expect(() => validateDockerCompose(emptyImageConfig))
      .toThrow(/Service 'webapp' does not have an image specified/);
  });

  test('should accept configuration with optional properties', () => {
    const configWithOptionals = {
      services: {
        webapp: {
          image: 'node:14',
          ports: ['3000:3000'],
          command: 'npm start',
          restart: 'always',
          volumes: ['./app:/app'],
          environment: ['NODE_ENV=production', 'DEBUG=false']
        }
      }
    };

    // Should not throw any error
    expect(() => validateDockerCompose(configWithOptionals)).not.toThrow();
  });

  test('should accept configuration with array-style environment variables', () => {
    const configWithArrayEnv = {
      services: {
        webapp: {
          image: 'node:14',
          environment: ['NODE_ENV=production', 'DEBUG=false']
        }
      }
    };

    // Should not throw any error
    expect(() => validateDockerCompose(configWithArrayEnv)).not.toThrow();
  });

  test('should accept configuration with object-style environment variables', () => {
    const configWithObjectEnv = {
      services: {
        webapp: {
          image: 'node:14',
          environment: {
            NODE_ENV: 'production',
            DEBUG: 'false'
          }
        }
      }
    };

    // Should not throw any error
    expect(() => validateDockerCompose(configWithObjectEnv)).not.toThrow();
  });
});