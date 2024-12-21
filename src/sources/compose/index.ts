import { SourceParser, SourceValidationError, EnvironmentOptions } from '../base';
import { ApplicationConfig, ContainerConfig } from '../../types/container-config';
import { processEnvironmentVariablesGeneration } from '../../utils/processEnvironmentVariablesGeneration';
import { validateDockerCompose } from './validate';
import * as YAML from 'yaml';
import { parseDockerImage } from '../../utils/parseDockerImage';
import { parsePort } from '../../utils/parsePort';
import { normalizePort } from '../../utils/normalizePort';
import { normalizeVolume } from '../../utils/normalizeVolume';
import { normalizeEnvironment } from '../../utils/normalizeEnvironment';

interface DockerComposeService {
  image: string;
  ports?: string[];
  command?: string;
  restart?: string;
  volumes?: string[];
  environment?: { [key: string]: string } | string[];
}

interface DockerCompose {
  services: {
    [key: string]: DockerComposeService;
  };
}

export class ComposeParser implements SourceParser {
  parse(content: string, environmentOptions?: EnvironmentOptions): ApplicationConfig {
    const dockerCompose = YAML.parse(content) as DockerCompose;
    this.validate(content);

    const services: { [key: string]: ContainerConfig } = {};
    
    for (const [serviceName, service] of Object.entries(dockerCompose.services)) {
      services[serviceName] = this.normalizeService(serviceName, service, environmentOptions);
    }

    return { services };
  }

  validate(content: string): boolean {
    try {
      const dockerCompose = YAML.parse(content) as DockerCompose;
      validateDockerCompose(dockerCompose);
      return true;
    } catch (e: unknown) {
      if (e instanceof SourceValidationError) {
        throw e;
      }
      throw new SourceValidationError(`Invalid Docker Compose file: ${(e as Error).message}`);
    }
  }

  private normalizeService(
    serviceName: string,
    service: DockerComposeService, 
    environmentOptions?: EnvironmentOptions
  ): ContainerConfig {  
    const ports = (service.ports || []).map(port => {
      if (typeof port === 'string') {
        return normalizePort(port);
      }
      return {
        host: parsePort(port) || 0,
        container: parsePort(port) || 0
      };
    });

    const image = parseDockerImage(service.image);
    
    // Get persisted environment variables if available
    const persistedEnv = environmentOptions?.getPersistedEnvVars?.(serviceName, image) || {};
    
    const serviceEnv = normalizeEnvironment(
      service.environment,
      environmentOptions?.environmentVariables
    );
    
    const mergedEnv = {
      ...serviceEnv,
      ...persistedEnv
    };
    
    const processedEnv = processEnvironmentVariablesGeneration(
      mergedEnv,
      image,
      environmentOptions?.environmentGeneration
    );

    // Store the processed environment variables if persistence is enabled
    if (environmentOptions?.setPersistedEnvVars) {
      environmentOptions.setPersistedEnvVars(serviceName, processedEnv);
    }

    return {
      image,
      ports,
      volumes: (service.volumes || []).map(volume => normalizeVolume(volume)),
      environment: processedEnv,
      command: service.command,
      restart: service.restart
    };
  }
}