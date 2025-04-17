/**
 * Assertions for validating port mappings in DigitalOcean App Platform YAML output
 */

/**
 * Validates that the port mappings in the DigitalOcean YAML match expected values
 * 
 * @param doYaml The parsed DigitalOcean YAML template
 * @param serviceName The name of the service to check
 * @param expectedPort The expected port value 
 * @returns boolean indicating if validation passes
 */
export function validatePortMappingInDigitalOcean(
  doYaml: any, 
  serviceName: string, 
  expectedPort: number
): boolean {
  if (!doYaml.spec || !doYaml.spec.services || !Array.isArray(doYaml.spec.services)) {
    console.error('DigitalOcean YAML does not contain a services array in spec');
    return false;
  }

  // Find the specific service by name
  const service = doYaml.spec.services.find(
    (svc: any) => svc.name === serviceName
  );
  
  if (!service) {
    console.error(`Service '${serviceName}' not found in DigitalOcean YAML`);
    return false;
  }
  
  // Check for HTTP port first for web services
  if (service.http_port !== undefined) {
    if (service.http_port !== expectedPort) {
      console.error(
        `Service '${serviceName}' has incorrect http_port: ` +
        `expected ${expectedPort}, got ${service.http_port}`
      );
      return false;
    }
    return true;
  }
  
  // Check for internal_ports for non-web services (like databases)
  if (service.internal_ports && Array.isArray(service.internal_ports)) {
    if (!service.internal_ports.includes(expectedPort)) {
      console.error(
        `Service '${serviceName}' internal_ports does not include expected port ${expectedPort}`
      );
      return false;
    }
    return true;
  }
  
  // If no port configuration found, check if service has PORT env var
  if (service.envs && Array.isArray(service.envs)) {
    const portEnvVar = service.envs.find(
      (env: any) => env.key === 'PORT' && env.scope === 'RUN_TIME'
    );
    
    if (portEnvVar) {
      if (portEnvVar.value !== expectedPort.toString()) {
        console.error(
          `Service '${serviceName}' has incorrect PORT env value: ` + 
          `expected '${expectedPort}', got '${portEnvVar.value}'`
        );
        return false;
      }
      return true;
    }
  }
  
  console.error(`Service '${serviceName}' has no port configuration`);
  return false;
}

/**
 * Validates port configurations across multiple services
 * @param doYaml The parsed DigitalOcean YAML template
 * @param expectedPorts Map of service names to their expected ports
 * @returns boolean indicating if all validations pass
 */
export function validateMultiplePortMappings(
  doYaml: any,
  expectedPorts: Record<string, number>
): boolean {
  let allValid = true;
  
  for (const [serviceName, expectedPort] of Object.entries(expectedPorts)) {
    const isValid = validatePortMappingInDigitalOcean(
      doYaml,
      serviceName,
      expectedPort
    );
    
    if (!isValid) {
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Validates that a service has the PORT environment variable set correctly
 * @param doYaml The parsed DigitalOcean YAML template
 * @param serviceName The name of the service to check
 * @param expectedValue The expected value for the PORT variable
 * @returns boolean indicating if validation passes
 */
export function validatePortEnvironmentVariable(
  doYaml: any,
  serviceName: string,
  expectedValue: string
): boolean {
  if (!doYaml.spec || !doYaml.spec.services || !Array.isArray(doYaml.spec.services)) {
    console.error('DigitalOcean YAML does not contain a services array in spec');
    return false;
  }

  // Find the specific service by name
  const service = doYaml.spec.services.find(
    (svc: any) => svc.name === serviceName
  );
  
  if (!service) {
    console.error(`Service '${serviceName}' not found in DigitalOcean YAML`);
    return false;
  }
  
  // Check if service has environment variables
  if (!service.envs || !Array.isArray(service.envs)) {
    console.error(`Service '${serviceName}' does not have environment variables`);
    return false;
  }
  
  // Find the PORT environment variable
  const portEnvVar = service.envs.find(
    (env: any) => env.key === 'PORT'
  );
  
  if (!portEnvVar) {
    console.error(`Service '${serviceName}' is missing PORT environment variable`);
    return false;
  }
  
  if (portEnvVar.value !== expectedValue) {
    console.error(
      `Service '${serviceName}' has incorrect PORT value: ` + 
      `expected '${expectedValue}', got '${portEnvVar.value}'`
    );
    return false;
  }
  
  return true;
}
