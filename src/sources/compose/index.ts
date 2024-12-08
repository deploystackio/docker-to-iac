import { SourceParser, SourceValidationError } from '../base';
import { ApplicationConfig, ContainerConfig } from '../../types/container-config';
import { validateDockerCompose } from './validate';
import * as YAML from 'yaml';
import { parseDockerImage } from '../../utils/parseDockerImage';
import { parsePort } from '../../utils/parsePort';

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
    // Normalize environment variables
    let normalizedEnv: { [key: string]: string } = {};
    if (service.environment) {
      if (Array.isArray(service.environment)) {
        service.environment.forEach(env => {
          const [key, value] = env.split('=');
          normalizedEnv[key] = value || '';
        });
      } else {
        normalizedEnv = service.environment;
      }
    }

    // Normalize ports
    const ports = (service.ports || []).map(port => {
      if (typeof port === 'string') {
        const [hostStr, containerStr] = port.split(':');
        return {
          host: parseInt(hostStr, 10),
          container: parseInt(containerStr || hostStr, 10),
          protocol: port.includes('/') ? port.split('/')[1] : undefined
        };
      }
      return {
        host: parsePort(port) || 0,
        container: parsePort(port) || 0
      };
    });

    // Normalize volumes
    const volumes = (service.volumes || []).map(volume => {
      const [host, container, mode] = volume.split(':');
      return {
        host,
        container: container || host,
        mode
      };
    });

    return {
      image: parseDockerImage(service.image),
      ports,
      volumes,
      environment: normalizedEnv,
      command: service.command,
      restart: service.restart
    };
  }
}
