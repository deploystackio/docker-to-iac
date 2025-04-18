import { translate } from '../../src/index';
import { TemplateFormat } from '../../src/parsers/base-parser';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { assertRenderYamlStructure } from './assertions/render';
import { validatePortEnvironmentVariable } from './assertions/port-assertions';
import { assertDigitalOceanYamlStructure, validateDatabaseService } from './assertions/digitalocean';
import { validatePortMappingInDigitalOcean, validatePortEnvironmentVariable as validateDOPortEnvironmentVariable } from './assertions/do-port-assertions';

// Constants for directories
const DOCKER_RUN_DIR = join(__dirname, 'docker-run-files');
const DOCKER_COMPOSE_DIR = join(__dirname, 'docker-compose-files');
const OUTPUT_DIR = join(__dirname, 'output');

/**
 * Run the port mapping test using Docker run command
 */
async function runDockerRunPortTest(): Promise<boolean> {
  console.log('\n--- Running Docker Run Port Mapping Test ---');
  
  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test2', 'docker-run');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;
  
  try {
    // Read and normalize the docker run command
    const dockerRunPath = join(DOCKER_RUN_DIR, 'test2.txt');
    const command = readFileSync(dockerRunPath, 'utf8')
      .replace(/\\\n/g, ' ')  // Remove line continuations
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();                // Remove leading/trailing whitespace

    console.log(`Running test for command: ${command}`);

    // Test translation to Render
    console.log('Testing translation to Render...');
    
    const renderTranslationResult = translate(command, {
      source: 'run',
      target: 'RND',
      templateFormat: TemplateFormat.yaml
    });

    // Create directory for Render output
    const renderOutputDir = join(testOutputDir, 'rnd');
    if (!existsSync(renderOutputDir)) {
      mkdirSync(renderOutputDir, { recursive: true });
    }

    // Save all files with proper directory structure
    Object.entries(renderTranslationResult.files).forEach(([path, fileData]) => {
      const fullPath = join(renderOutputDir, path);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, fileData.content);
      console.log(`✓ Created Render output: ${path}`);
    });

    // Run assertions for Render
    const renderYamlPath = join(renderOutputDir, 'render.yaml');
    if (existsSync(renderYamlPath)) {
      const renderYaml = yaml.parse(readFileSync(renderYamlPath, 'utf8'));
      
      try {
        // 1. Validate YAML structure
        assertRenderYamlStructure(renderYaml);
        console.log('✓ Render YAML structure validation passed');
        
        // 2. Check for port mapping via PORT env var - Docker run creates a service named 'default'
        const portMappingValid = validatePortEnvironmentVariable(renderYaml, 'default', '8080');
        if (portMappingValid) {
          console.log('✓ Port mapping validation passed');
        } else {
          testPassed = false;
          console.error('❌ Port mapping validation failed');
        }
      } catch (error) {
        testPassed = false;
        console.error('❌ Render YAML validation failed:', error);
      }
    } else {
      testPassed = false;
      console.error('❌ Render YAML file not found');
    }

    // Test translation to DigitalOcean
    console.log('\nTesting translation to DigitalOcean...');
    
    const doTranslationResult = translate(command, {
      source: 'run',
      target: 'DOP',
      templateFormat: TemplateFormat.yaml
    });

    // Create directory for DigitalOcean output
    const doOutputDir = join(testOutputDir, 'dop');
    if (!existsSync(doOutputDir)) {
      mkdirSync(doOutputDir, { recursive: true });
    }

    // Save all files with proper directory structure
    Object.entries(doTranslationResult.files).forEach(([path, fileData]) => {
      const fullPath = join(doOutputDir, path);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, fileData.content);
      console.log(`✓ Created DigitalOcean output: ${path}`);
    });

    // Run assertions for DigitalOcean
    const doYamlPath = join(doOutputDir, '.do/deploy.template.yaml');
    if (existsSync(doYamlPath)) {
      const doYaml = yaml.parse(readFileSync(doYamlPath, 'utf8'));
      
      try {
        // 1. Validate YAML structure
        assertDigitalOceanYamlStructure(doYaml);
        console.log('✓ DigitalOcean YAML structure validation passed');
        
        // 2. Check for port mapping - service name may be different due to DO naming requirements
        const serviceName = doYaml.spec.services[0].name;
        
        // In DigitalOcean, the http_port should be set to 8080
        const portMappingValid = validatePortMappingInDigitalOcean(doYaml, serviceName, 8080);
        if (portMappingValid) {
          console.log('✓ DigitalOcean port mapping validation passed');
        } else {
          // Check if there's a PORT environment variable as a fallback
          const portEnvValid = validateDOPortEnvironmentVariable(doYaml, serviceName, '8080');
          if (portEnvValid) {
            console.log('✓ DigitalOcean PORT environment variable validation passed');
          } else {
            testPassed = false;
            console.error('❌ DigitalOcean port mapping validation failed');
          }
        }
      } catch (error) {
        testPassed = false;
        console.error('❌ DigitalOcean YAML validation failed:', error);
      }
    } else {
      testPassed = false;
      console.error('❌ DigitalOcean YAML file not found');
    }
  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`--- Docker Run Port Test ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the port mapping test using Docker Compose
 */
async function runDockerComposePortTest(): Promise<boolean> {
  console.log('\n--- Running Docker Compose Port Mapping Test ---');
  
  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test2', 'docker-compose');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;
  
  try {
    // Read the docker compose file
    const dockerComposePath = join(DOCKER_COMPOSE_DIR, 'test2.yml');
    const composeContent = readFileSync(dockerComposePath, 'utf8');

    console.log('Testing Docker Compose translation to Render...');
    
    const renderTranslationResult = translate(composeContent, {
      source: 'compose',
      target: 'RND',
      templateFormat: TemplateFormat.yaml
    });

    // Create directory for Render output
    const renderOutputDir = join(testOutputDir, 'rnd');
    if (!existsSync(renderOutputDir)) {
      mkdirSync(renderOutputDir, { recursive: true });
    }

    // Save all files with proper directory structure
    Object.entries(renderTranslationResult.files).forEach(([path, fileData]) => {
      const fullPath = join(renderOutputDir, path);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, fileData.content);
      console.log(`✓ Created Render output: ${path}`);
    });

    // Run assertions for Render
    const renderYamlPath = join(renderOutputDir, 'render.yaml');
    if (existsSync(renderYamlPath)) {
      const renderYaml = yaml.parse(readFileSync(renderYamlPath, 'utf8'));
      
      try {
        // 1. Validate YAML structure
        assertRenderYamlStructure(renderYaml);
        console.log('✓ Render YAML structure validation passed');
        
        // 2. Check for port mappings via PORT env vars across multiple services
        const webPortValid = validatePortEnvironmentVariable(renderYaml, 'web', '80');
        const apiPortValid = validatePortEnvironmentVariable(renderYaml, 'api', '8080');
        
        if (webPortValid && apiPortValid) {
          console.log('✓ Multiple port mappings validation passed');
        } else {
          testPassed = false;
          console.error('❌ Multiple port mappings validation failed');
        }
        
        // 3. Check database service - this should be in the databases section for Render
        const hasDatabase = renderYaml.databases && 
                            Array.isArray(renderYaml.databases) && 
                            renderYaml.databases.some((db: any) => db.name.includes('db'));
        
        if (hasDatabase) {
          console.log('✓ Database service validation passed');
        } else {
          testPassed = false;
          console.error('❌ Database service validation failed - expected PostgreSQL to be in databases section');
        }
      } catch (error) {
        testPassed = false;
        console.error('❌ Render YAML validation failed:', error);
      }
    } else {
      testPassed = false;
      console.error('❌ Render YAML file not found');
    }

    // Test translation to DigitalOcean
    console.log('\nTesting Docker Compose translation to DigitalOcean...');
    
    const doTranslationResult = translate(composeContent, {
      source: 'compose',
      target: 'DOP',
      templateFormat: TemplateFormat.yaml
    });

    // Create directory for DigitalOcean output
    const doOutputDir = join(testOutputDir, 'dop');
    if (!existsSync(doOutputDir)) {
      mkdirSync(doOutputDir, { recursive: true });
    }

    // Save all files with proper directory structure
    Object.entries(doTranslationResult.files).forEach(([path, fileData]) => {
      const fullPath = join(doOutputDir, path);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, fileData.content);
      console.log(`✓ Created DigitalOcean output: ${path}`);
    });

    // Run assertions for DigitalOcean
    const doYamlPath = join(doOutputDir, '.do/deploy.template.yaml');
    if (existsSync(doYamlPath)) {
      const doYaml = yaml.parse(readFileSync(doYamlPath, 'utf8'));
      
      try {
        // 1. Validate YAML structure
        assertDigitalOceanYamlStructure(doYaml);
        console.log('✓ DigitalOcean YAML structure validation passed');
        
        // 2. Check for port mappings
        // Find web service - may have normalized name
        let webServiceName = '';
        let apiServiceName = '';
        
        for (const service of doYaml.spec.services) {
          if (service.image && service.image.repository && 
              service.image.repository.toLowerCase().includes('nginx')) {
            webServiceName = service.name;
          } else if (service.image && service.image.repository && 
                    service.image.repository.toLowerCase().includes('node')) {
            apiServiceName = service.name;
          }
        }
        
        let portMappingsValid = true;
        
        if (!webServiceName) {
          portMappingsValid = false;
          console.error('❌ Web service not found in DigitalOcean YAML');
        } else {
          // Validate web service port (should be 80 or PORT env)
          const webPortValid = validatePortMappingInDigitalOcean(doYaml, webServiceName, 80);
          if (!webPortValid) {
            portMappingsValid = false;
            console.error('❌ Web service port mapping validation failed');
          }
        }
        
        if (!apiServiceName) {
          portMappingsValid = false;
          console.error('❌ API service not found in DigitalOcean YAML');
        } else {
          // Validate API service port (should be 8080)
          const apiPortValid = validatePortMappingInDigitalOcean(doYaml, apiServiceName, 8080);
          if (!apiPortValid) {
            portMappingsValid = false;
            console.error('❌ API service port mapping validation failed');
          }
        }
        
        if (portMappingsValid) {
          console.log('✓ Multiple port mappings validation passed');
        } else {
          testPassed = false;
          console.error('❌ Multiple port mappings validation failed');
        }
        
        // 3. Check for database service - this should be in the databases section
        const hasPostgresDb = validateDatabaseService(doYaml, 'PG');
        
        if (hasPostgresDb) {
          console.log('✓ DigitalOcean database service validation passed');
        } else {
          testPassed = false;
          console.error('❌ DigitalOcean database service validation failed');
        }
      } catch (error) {
        testPassed = false;
        console.error('❌ DigitalOcean YAML validation failed:', error);
      }
    } else {
      testPassed = false;
      console.error('❌ DigitalOcean YAML file not found');
    }
  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`--- Docker Compose Port Test ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Main test runner for Test 2: Port Mappings
 */
export async function runTest2(): Promise<boolean> {
  console.log('\n=== Running Test 2: Port Mappings ===');
  
  // Create output directory for this test
  const testOutputDir = join(OUTPUT_DIR, 'test2');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  // Run both subtests
  const dockerRunTestPassed = await runDockerRunPortTest();
  const dockerComposeTestPassed = await runDockerComposePortTest();
  
  // Overall test passes if both subtests pass
  const overallTestPassed = dockerRunTestPassed && dockerComposeTestPassed;
  
  console.log(`=== Test 2 ${overallTestPassed ? 'PASSED ✓' : 'FAILED ❌'} ===`);
  return overallTestPassed;
}
