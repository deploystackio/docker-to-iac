/**
 * Assertions for validating Render.com Blueprint YAML output
 */

/**
 * Asserts that the Render YAML has the correct structure
 * @param renderYaml The parsed Render YAML blueprint
 * @throws Error if the validation fails
 */
export function assertRenderYamlStructure(renderYaml: any): void {
  // Check for services array
  if (!renderYaml.services || !Array.isArray(renderYaml.services)) {
    throw new Error('Render YAML must contain a services array');
  }

  // Check that there's at least one service
  if (renderYaml.services.length === 0) {
    throw new Error('Render YAML must contain at least one service');
  }

  // Validate each service has required properties
  renderYaml.services.forEach((service: any, index: number) => {
    if (!service.name) {
      throw new Error(`Service at index ${index} is missing a name`);
    }
    
    if (!service.type) {
      throw new Error(`Service ${service.name} is missing a type`);
    }
    
    if (!service.image || !service.image.url) {
      throw new Error(`Service ${service.name} is missing an image URL`);
    }
  });
}

/**
 * Validates that the environment variables in the Render YAML match expected values
 * @param renderYaml The parsed Render YAML blueprint
 * @param expectedEnvVars The expected environment variables
 * @returns true if validation passes, false otherwise
 */
export function validateEnvironmentVariables(renderYaml: any, expectedEnvVars: Record<string, string>): boolean {
  if (!renderYaml.services || !Array.isArray(renderYaml.services) || renderYaml.services.length === 0) {
    return false;
  }

  // Get the first service (for docker run tests there will usually be only one)
  const service = renderYaml.services[0];
  
  // Check if service has environment variables
  if (!service.envVars || !Array.isArray(service.envVars)) {
    return false;
  }
  
  // Convert envVars array to a key-value object for easier comparison
  const actualEnvVars: Record<string, string> = {};
  service.envVars.forEach((envVar: any) => {
    if (envVar.key && envVar.value !== undefined) {
      actualEnvVars[envVar.key] = envVar.value;
    }
  });

  // Check that all expected environment variables exist with correct values
  for (const [key, expectedValue] of Object.entries(expectedEnvVars)) {
    if (!(key in actualEnvVars)) {
      console.error(`Missing environment variable: ${key}`);
      return false;
    }
    
    if (actualEnvVars[key] !== expectedValue) {
      console.error(`Environment variable ${key} has incorrect value: expected '${expectedValue}', got '${actualEnvVars[key]}'`);
      return false;
    }
  }

  return true;
}

/**
 * Validates that the service has the correct disk configuration
 * @param renderYaml The parsed Render YAML blueprint
 * @param mountPath The expected mount path
 * @returns true if validation passes, false otherwise
 */
export function validateVolumeMappingInRender(renderYaml: any, mountPath: string): boolean {
  if (!renderYaml.services || !Array.isArray(renderYaml.services) || renderYaml.services.length === 0) {
    return false;
  }

  // Check if any service has a disk with the specified mountPath
  return renderYaml.services.some((service: any) => {
    return service.disk && service.disk.mountPath === mountPath;
  });
}
