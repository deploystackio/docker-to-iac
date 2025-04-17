/**
 * Assertions for validating port mappings in Render.com Blueprint YAML output
 */

/**
 * Validates that the port mappings in the Render YAML match expected values
 * Render doesn't explicitly set http_port in all cases, but uses the PORT env variable
 * 
 * @param renderYaml The parsed Render YAML blueprint
 * @param serviceName The name of the service to check
 * @param expectedPort The expected port value 
 * @returns boolean indicating if validation passes
 */
export function validatePortMappingInRender(
  renderYaml: any, 
  serviceName: string, 
  expectedPort: number
): boolean {
  if (!renderYaml.services || !Array.isArray(renderYaml.services)) {
    console.error('Render YAML does not contain a services array');
    return false;
  }

  // Find the specific service by name
  const service = renderYaml.services.find(
    (svc: any) => svc.name === serviceName
  );
  
  if (!service) {
    console.error(`Service '${serviceName}' not found in Render YAML`);
    return false;
  }
  
  // Check for explicit http_port first
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
  
  // If no http_port, check for PORT environment variable
  if (!service.envVars || !Array.isArray(service.envVars)) {
    console.error(`Service '${serviceName}' does not have environment variables`);
    return false;
  }
  
  const portEnvVar = service.envVars.find(
    (env: any) => env.key === 'PORT'
  );
  
  if (!portEnvVar) {
    console.error(`Service '${serviceName}' is missing PORT environment variable`);
    return false;
  }
  
  if (portEnvVar.value !== expectedPort.toString()) {
    console.error(
      `Service '${serviceName}' has incorrect PORT value: ` + 
      `expected '${expectedPort}', got '${portEnvVar.value}'`
    );
    return false;
  }
  
  return true;
}

/**
 * Validates port configurations across multiple services
 * @param renderYaml The parsed Render YAML blueprint
 * @param expectedPorts Map of service names to their expected ports
 * @returns boolean indicating if all validations pass
 */
export function validateMultiplePortMappings(
  renderYaml: any,
  expectedPorts: Record<string, number>
): boolean {
  let allValid = true;
  
  for (const [serviceName, expectedPort] of Object.entries(expectedPorts)) {
    const isValid = validatePortMappingInRender(
      renderYaml,
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
 * @param renderYaml The parsed Render YAML blueprint
 * @param serviceName The name of the service to check
 * @param expectedValue The expected value for the PORT variable
 * @returns boolean indicating if validation passes
 */
export function validatePortEnvironmentVariable(
  renderYaml: any,
  serviceName: string,
  expectedValue: string
): boolean {
  if (!renderYaml.services || !Array.isArray(renderYaml.services)) {
    console.error('Render YAML does not contain a services array');
    return false;
  }

  // Find the specific service by name
  const service = renderYaml.services.find(
    (svc: any) => svc.name === serviceName
  );
  
  if (!service) {
    console.error(`Service '${serviceName}' not found in Render YAML`);
    return false;
  }
  
  // Check if service has environment variables
  if (!service.envVars || !Array.isArray(service.envVars)) {
    console.error(`Service '${serviceName}' does not have environment variables`);
    return false;
  }
  
  // Find the PORT environment variable
  const portEnvVar = service.envVars.find(
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
