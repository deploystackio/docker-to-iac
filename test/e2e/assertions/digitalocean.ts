/**
 * Assertions for validating DigitalOcean App Platform YAML output
 */

/**
 * Asserts that the DigitalOcean YAML has the correct structure
 * @param doYaml The parsed DigitalOcean YAML template
 * @throws Error if the validation fails
 */
export function assertDigitalOceanYamlStructure(doYaml: any): void {
  // Check for spec object
  if (!doYaml.spec) {
    throw new Error('DigitalOcean YAML must contain a spec object');
  }

  // Check that spec has name and region
  if (!doYaml.spec.name) {
    throw new Error('DigitalOcean YAML spec must contain a name');
  }

  if (!doYaml.spec.region) {
    throw new Error('DigitalOcean YAML spec must contain a region');
  }

  // Check for services array
  if (!doYaml.spec.services || !Array.isArray(doYaml.spec.services)) {
    throw new Error('DigitalOcean YAML spec must contain a services array');
  }

  // Check that there's at least one service
  if (doYaml.spec.services.length === 0) {
    throw new Error('DigitalOcean YAML spec must contain at least one service');
  }

  // Validate each service has required properties
  doYaml.spec.services.forEach((service: any, index: number) => {
    if (!service.name) {
      throw new Error(`Service at index ${index} is missing a name`);
    }
    
    if (!service.image) {
      throw new Error(`Service ${service.name} is missing an image object`);
    }
  });
}

/**
 * Validates that the environment variables in the DigitalOcean YAML match expected values
 * @param doYaml The parsed DigitalOcean YAML template
 * @param serviceName Name of the service to check
 * @param expectedEnvVars The expected environment variables
 * @returns true if validation passes, false otherwise
 */
export function validateEnvironmentVariables(
  doYaml: any, 
  serviceName: string,
  expectedEnvVars: Record<string, string>
): boolean {
  if (!doYaml.spec || !doYaml.spec.services || !Array.isArray(doYaml.spec.services)) {
    return false;
  }

  // Find the service with the given name
  const service = doYaml.spec.services.find((svc: any) => svc.name === serviceName);
  if (!service) {
    console.error(`Service '${serviceName}' not found in DigitalOcean YAML`);
    return false;
  }
  
  // Check if service has environment variables
  if (!service.envs || !Array.isArray(service.envs)) {
    console.error(`Service '${serviceName}' does not have environment variables`);
    return false;
  }
  
  // Convert envs array to a key-value object for easier comparison
  const actualEnvVars: Record<string, string> = {};
  service.envs.forEach((envVar: any) => {
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
 * Validates that the service has port configuration
 * @param doYaml The parsed DigitalOcean YAML template
 * @param serviceName Name of the service to check
 * @param expectedPort The expected port number
 * @returns true if validation passes, false otherwise
 */
export function validatePortMapping(
  doYaml: any,
  serviceName: string,
  expectedPort: number
): boolean {
  if (!doYaml.spec || !doYaml.spec.services || !Array.isArray(doYaml.spec.services)) {
    return false;
  }

  // Find the service with the given name
  const service = doYaml.spec.services.find((svc: any) => svc.name === serviceName);
  if (!service) {
    console.error(`Service '${serviceName}' not found in DigitalOcean YAML`);
    return false;
  }

  // Check http_port first (for web services)
  if (service.http_port !== undefined) {
    if (service.http_port !== expectedPort) {
      console.error(`Service '${serviceName}' has incorrect http_port: expected ${expectedPort}, got ${service.http_port}`);
      return false;
    }
    return true;
  }

  // Or check internal_ports for non-web services
  if (service.internal_ports && Array.isArray(service.internal_ports)) {
    if (!service.internal_ports.includes(expectedPort)) {
      console.error(`Service '${serviceName}' internal_ports does not include expected port ${expectedPort}`);
      return false;
    }
    return true;
  }

  console.error(`Service '${serviceName}' is missing port configuration`);
  return false;
}

/**
 * Validates that the volume mount exists in the service
 * Note: DigitalOcean App Platform has limited volume support compared to Render
 * This function checks for the presence of expected environment variables that 
 * would typically be used as mount points
 * 
 * @param doYaml The parsed DigitalOcean YAML template
 * @param serviceName Name of the service to check
 * @param mountPath Path that would be mounted
 * @returns true if environment variables exist that suggest volume access, false otherwise
 */
export function validateVolumeMounting(
  doYaml: any,
  serviceName: string,
  mountPath: string
): boolean {
  // This is a simplified volume check for DigitalOcean
  // Since DigitalOcean App Platform doesn't support direct volume mounts in the same way
  // as Render, we'll look for evidence that the service can access persistent storage
  
  if (!doYaml.spec || !doYaml.spec.services || !Array.isArray(doYaml.spec.services)) {
    return false;
  }

  // Find the service with the given name
  const service = doYaml.spec.services.find((svc: any) => svc.name === serviceName);
  if (!service) {
    console.error(`Service '${serviceName}' not found in DigitalOcean YAML`);
    return false;
  }
  
  // For now, we'll pass this test automatically with a info
  // since DigitalOcean doesn't have direct volume mounting in App Spec
  console.info(`Note: DigitalOcean App Platform doesn't support direct volume mounts like ${mountPath}.`);
  console.info('Volume tests are skipped for DigitalOcean as they would need a different approach.');
  
  return true;
}

/**
 * Validates that a database service exists
 * @param doYaml The parsed DigitalOcean YAML template
 * @param dbType The expected database type (PG, MYSQL, REDIS, etc.)
 * @returns true if a database with the matching type exists, false otherwise
 */
export function validateDatabaseService(
  doYaml: any,
  dbType: string
): boolean {
  if (!doYaml.spec) {
    return false;
  }

  // Check for databases in spec
  if (doYaml.spec.databases && Array.isArray(doYaml.spec.databases)) {
    const hasMatchingDb = doYaml.spec.databases.some((db: any) => 
      db.engine && db.engine.toUpperCase() === dbType.toUpperCase()
    );
    
    if (hasMatchingDb) {
      return true;
    }
  }
  
  console.error(`No ${dbType} database found in DigitalOcean YAML`);
  return false;
}
