import { SourceParser, SourceValidationError, EnvironmentOptions } from '../base';
import { ApplicationConfig, ContainerConfig } from '../../types/container-config';
import { parseDockerImage } from '../../utils/parseDockerImage';
import { RegistryType, DockerImageInfo } from '../../parsers/base-parser';
import { normalizePort } from '../../utils/normalizePort';
import { normalizeVolume } from '../../utils/normalizeVolume';
import { normalizeEnvironment } from '../../utils/normalizeEnvironment';
import { processEnvironmentVariablesGeneration } from '../../utils/processEnvironmentVariablesGeneration';

export class RunCommandParser implements SourceParser {
  parse(content: string, environmentOptions?: EnvironmentOptions): ApplicationConfig {
    this.validate(content);

    const parts = this.splitCommand(content.trim());
    
    if (parts[0] !== 'docker' || parts[1] !== 'run') {
      throw new SourceValidationError('Command must start with "docker run"');
    }

    const config: ContainerConfig = {
      image: {
        registry_type: RegistryType.DOCKER_HUB,
        repository: ''
      } as DockerImageInfo,
      ports: [],
      volumes: [],
      environment: {},
      command: '',
      restart: ''
    };

    // Parse the arguments
    let i = 2; // Skip 'docker' and 'run'
    let imageFound = false;
    const commandParts: string[] = [];
    
    while (i < parts.length) {
      const arg = parts[i];

      // If we haven't found the image yet and the argument starts with a dash,
      // it's an option
      if (!imageFound && arg.startsWith('-')) {
        switch (arg) {
          case '-p':
          case '--publish':
            if (i + 1 < parts.length) {
              const portMapping = this.parsePortMapping(parts[++i]);
              if (portMapping) {
                config.ports.push(portMapping);
              }
            }
            break;

          case '-e':
          case '--env':
            if (i + 1 < parts.length) {
              const envVar = this.parseEnvironmentVariable(parts[++i]);
              config.environment = { ...config.environment, ...envVar };
            }
            break;

          case '-v':
          case '--volume':
            if (i + 1 < parts.length) {
              const volume = this.parseVolumeMapping(parts[++i]);
              config.volumes.push(volume);
            }
            break;

          default:
            // Some flags take arguments, some don't
            if (arg === '--rm' || arg === '-d' || arg === '--detach') {
              // These are standalone flags - don't skip anything
            } else if (i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
              // This option likely has a value - skip it
              i++;
            }
        }
      } else if (!imageFound) {
        // First non-option argument is the image
        config.image = parseDockerImage(arg);
        imageFound = true;
      } else {
        // Any arguments after the image are part of the command
        commandParts.push(arg);
      }
      
      i++;
    }
    
    // Join the command parts if any were found
    if (commandParts.length > 0) {
      config.command = commandParts.join(' ');
    }

    if (environmentOptions) {
      const serviceName = 'default';  // Docker run always uses 'default' as service name
      
      // Get persisted environment variables if available
      const persistedEnv = environmentOptions.getPersistedEnvVars?.(serviceName, config.image) || {};
      
      // Start with original environment variables
      let processedEnv: Record<string, string> = {
        ...config.environment,
        ...persistedEnv
      };

      // If we have auto-generation config, use it
      if (environmentOptions.environmentGeneration) {
        processedEnv = processEnvironmentVariablesGeneration(
          processedEnv,
          config.image,
          environmentOptions.environmentGeneration
        );
      }

      // Then apply any .env file substitutions if they exist
      if (environmentOptions.environmentVariables) {
        for (const [key, value] of Object.entries(processedEnv)) {
          if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
            const envVarName = value.slice(2, -1);
            if (environmentOptions.environmentVariables[envVarName]) {
              processedEnv[key] = environmentOptions.environmentVariables[envVarName];
            }
          }
        }
      }

      // Store the processed environment variables if persistence is enabled
      if (environmentOptions.setPersistedEnvVars) {
        environmentOptions.setPersistedEnvVars(serviceName, processedEnv);
      }

      config.environment = processedEnv;
    }

    return {
      services: {
        'default': config
      }
    };
  }

  validate(content: string): boolean {
    if (!content.trim().startsWith('docker run')) {
      throw new SourceValidationError('Command must start with "docker run"');
    }
    
    // Basic validation - we'll improve this
    if (!content.includes(' ')) {
      throw new SourceValidationError('Invalid docker run command format');
    }

    return true;
  }

  private splitCommand(command: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      
      if ((char === '\'' || char === '"') && (inQuotes === false || quoteChar === char)) {
        inQuotes = !inQuotes;
        if (inQuotes) quoteChar = char;
        else quoteChar = '';
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push(current);
    }
    
    return parts;
  }

  private parsePortMapping(portString: string) {
    return normalizePort(portString);
  }

  private parseEnvironmentVariable(envString: string) {
    return normalizeEnvironment(envString);
  }

  private parseVolumeMapping(volumeString: string) {
    return normalizeVolume(volumeString);
  }
}
