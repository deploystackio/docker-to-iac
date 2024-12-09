import { SourceParser, SourceValidationError } from '../base';
import { ApplicationConfig, ContainerConfig } from '../../types/container-config';
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
  parse(content: string): ApplicationConfig {
    const dockerCompose = YAML.parse(content) as DockerCompose;
    this.validate(content); // Will throw if invalid

    const services: { [key: string]: ContainerConfig } = {};
    
    for (const [serviceName, service] of Object.entries(dockerCompose.services)) {
      services[serviceName] = this.normalizeService(service);
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

  private normalizeService(service: DockerComposeService): ContainerConfig {
    // Normalize ports
    const ports = (service.ports || []).map(port => {
      if (typeof port === 'string') {
        return normalizePort(port);
      }
      return {
        host: parsePort(port) || 0,
        container: parsePort(port) || 0
      };
    });

    return {
      image: parseDockerImage(service.image),
      ports,
      volumes: (service.volumes || []).map(volume => normalizeVolume(volume)),
      environment: normalizeEnvironment(service.environment),
      command: service.command,
      restart: service.restart
    };
  }
}
