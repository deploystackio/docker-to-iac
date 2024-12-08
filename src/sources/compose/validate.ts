import { SourceValidationError } from '../base';

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

export function validateDockerCompose(dockerCompose: DockerCompose): void {
  // Validation: Check if services exist
  if (!dockerCompose.services || Object.keys(dockerCompose.services).length === 0) {
    throw new SourceValidationError('No services found in docker-compose file');
  }

  // Validation: Check if each service has an image
  for (const [serviceName, service] of Object.entries<DockerComposeService>(dockerCompose.services)) {
    if (!service.image) {
      throw new SourceValidationError(
        `Service '${serviceName}' does not have an image specified. ` +
        'All services must use pre-built images. Build instructions are not supported.'
      );
    }
  }
}
