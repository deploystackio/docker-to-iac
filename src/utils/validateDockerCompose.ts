import { DockerCompose, DockerComposeService, DockerComposeValidationError } from '../parsers/base-parser';

export function validateDockerCompose(dockerCompose: DockerCompose): void {
  // Validation: Check if services exist
  if (!dockerCompose.services || Object.keys(dockerCompose.services).length === 0) {
    throw new DockerComposeValidationError('No services found in docker-compose file');
  }

  // Validation: Check if each service has an image
  for (const [serviceName, service] of Object.entries<DockerComposeService>(dockerCompose.services)) {
    if (!service.image) {
      throw new DockerComposeValidationError(
        `Service '${serviceName}' does not have an image specified. ` +
        'All services must use pre-built images. Build instructions are not supported.'
      );
    }
  }
}
