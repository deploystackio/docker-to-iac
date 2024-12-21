import { SourceParser, SourceValidationError, EnvironmentOptions } from '../base';
import { ApplicationConfig, ContainerConfig } from '../../types/container-config';
import { EnvironmentVariableGenerationConfig } from '../../types/environment-config';
import { parseDockerImage } from '../../utils/parseDockerImage';
import { RegistryType, DockerImageInfo } from '../../parsers/base-parser';
import { normalizePort } from '../../utils/normalizePort';
import { normalizeVolume } from '../../utils/normalizeVolume';
import { normalizeEnvironment } from '../../utils/normalizeEnvironment';
import { processEnvironmentVariablesGeneration } from '../../utils/processEnvironmentVariablesGeneration';

export class RunCommandParser implements SourceParser {
  parse(content: string, environmentOptions?: EnvironmentOptions): ApplicationConfig {
    this.validate(content);

    // Split the command into parts, handling quotes properly
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
    while (i < parts.length) {
      const arg = parts[i];

      if (arg.startsWith('-')) {
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

          // Handle image name (it's the last non-flag argument)
          default:
            if (!arg.startsWith('-')) {
              config.image = parseDockerImage(arg);
            }
        }
      } else {
        // This must be the image name
        config.image = parseDockerImage(arg);
      }
      
      i++;
    }

    if (environmentOptions) {
      let processedEnv: Record<string, string> = { ...config.environment };
  
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
            const envVarName = value.slice(2, -1); // Remove ${ and }
            if (environmentOptions.environmentVariables[envVarName]) {
              processedEnv[key] = environmentOptions.environmentVariables[envVarName];
            }
          }
        }
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
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i];
      

      if (char === '\'' || char === '"') {
        inQuotes = !inQuotes;
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
