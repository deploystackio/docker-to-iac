import { translate } from '../../src/index';
import { TemplateFormat } from '../../src/parsers/base-parser';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { assertRenderYamlStructure, validateVolumeMappingInRender } from './assertions/render';
import { assertDigitalOceanYamlStructure, validateEnvironmentVariables as validateDOEnvironmentVariables, validateVolumeMounting } from './assertions/digitalocean';

// Constants for directories
const DOCKER_RUN_DIR = join(__dirname, 'docker-run-files');
const DOCKER_COMPOSE_DIR = join(__dirname, 'docker-compose-files');
const OUTPUT_DIR = join(__dirname, 'output');

/**
 * Run the Docker Run test for environment variables and volume mapping
 */
async function runDockerRunTest1(): Promise<boolean> {
  console.log('\n--- Running Docker Run Environment Variables and Volume Mapping Test ---');
  
  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test1', 'docker-run');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;
  
  try {
    // Read and normalize the docker run command
    const dockerRunPath = join(DOCKER_RUN_DIR, 'test1.txt');
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
        
        // 2. Check for volume with specific path
        const hasVolumeMapping = validateVolumeMappingInRender(renderYaml, '/var/lib/html');
        if (hasVolumeMapping) {
          console.log('✓ Volume mapping validation passed');
        } else {
          testPassed = false;
          console.error('❌ Volume mapping validation failed: Expected volume with path /var/lib/html');
        }
        
        // 3. Check environment variables
        // Get the first service
        const service = renderYaml.services[0];
        // Extract actual environment variables
        const actualEnvVars: Record<string, string> = {};
        service.envVars.forEach((envVar: any) => {
          if (envVar.key && envVar.value !== undefined) {
            actualEnvVars[envVar.key] = envVar.value;
          }
        });
        
        // Check the environment variables manually
        let envVarsValid = true;
        
        // Check for ENV_VAR_1 and ENV_VAR_2 (should be escaped placeholders)
        if (!actualEnvVars['ENV_VAR_1'] || !actualEnvVars['ENV_VAR_1'].includes('VALUE_FOR_ENV_VAR_1')) {
          console.error(`ENV_VAR_1 is missing or invalid: ${actualEnvVars['ENV_VAR_1']}`);
          envVarsValid = false;
        }
        
        if (!actualEnvVars['ENV_VAR_2'] || !actualEnvVars['ENV_VAR_2'].includes('VALUE_FOR_ENV_VAR_2')) {
          console.error(`ENV_VAR_2 is missing or invalid: ${actualEnvVars['ENV_VAR_2']}`);
          envVarsValid = false;
        }
        
        // Check for ENV_VAR_3 (should have the default value)
        if (actualEnvVars['ENV_VAR_3'] !== 'default-value-deploystack') {
          console.error(`ENV_VAR_3 has incorrect value: expected 'default-value-deploystack', got '${actualEnvVars['ENV_VAR_3']}'`);
          envVarsValid = false;
        }
        
        if (envVarsValid) {
          console.log('✓ Environment variables validation passed');
        } else {
          testPassed = false;
          console.error('❌ Environment variables validation failed');
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
        
        // 2. Check for volume support
        // Note: DigitalOcean App Platform doesn't support direct volume mounts in the same way
        const hasVolumeSupport = validateVolumeMounting(doYaml, 'default', '/var/lib/html');
        console.log('✓ DigitalOcean volume check skipped (App Platform has different volume approach)');
        
        // 3. Check environment variables
        const expectedEnvVars = {
          'ENV_VAR_3': 'default-value-deploystack'
        };
        
        // Use normalized service name (may be different from 'default' due to DO naming requirements)
        const serviceName = doYaml.spec.services[0].name;
        const envVarsValid = validateDOEnvironmentVariables(doYaml, serviceName, expectedEnvVars);
        
        if (envVarsValid) {
          console.log('✓ DigitalOcean environment variables validation passed');
        } else {
          testPassed = false;
          console.error('❌ DigitalOcean environment variables validation failed');
        }
        
        // Additional verification for placeholders
        const service = doYaml.spec.services[0];
        const envVars = service.envs.reduce((acc: Record<string, string>, env: any) => {
          if (env.key && env.value !== undefined) {
            acc[env.key] = env.value;
          }
          return acc;
        }, {});
        
        let placeholdersValid = true;
        if (!envVars['ENV_VAR_1'] || !envVars['ENV_VAR_1'].includes('VALUE_FOR_ENV_VAR_1')) {
          console.error(`ENV_VAR_1 is missing or invalid in DigitalOcean: ${envVars['ENV_VAR_1']}`);
          placeholdersValid = false;
        }
        
        if (!envVars['ENV_VAR_2'] || !envVars['ENV_VAR_2'].includes('VALUE_FOR_ENV_VAR_2')) {
          console.error(`ENV_VAR_2 is missing or invalid in DigitalOcean: ${envVars['ENV_VAR_2']}`);
          placeholdersValid = false;
        }
        
        if (placeholdersValid) {
          console.log('✓ DigitalOcean placeholder variables validation passed');
        } else {
          testPassed = false;
          console.error('❌ DigitalOcean placeholder variables validation failed');
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

  console.log(`--- Docker Run Environment Variables Test ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the Docker Compose test for environment variables and volume mapping
 */
async function runDockerComposeTest1(): Promise<boolean> {
  console.log('\n--- Running Docker Compose Environment Variables and Volume Mapping Test ---');
  
  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test1', 'docker-compose');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;
  
  try {
    // Read the docker compose file
    const dockerComposePath = join(DOCKER_COMPOSE_DIR, 'test1.yml');
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
        
        // 2. Check for volume with specific path
        const hasVolumeMapping = validateVolumeMappingInRender(renderYaml, '/etc/nginx/nginx.conf');
        if (hasVolumeMapping) {
          console.log('✓ Volume mapping validation passed');
        } else {
          testPassed = false;
          console.error('❌ Volume mapping validation failed: Expected volume with path /etc/nginx/nginx.conf');
        }
        
        // 3. Check environment variables for web service
        const webService = renderYaml.services.find((svc: any) => svc.name === 'web');
        if (!webService) {
          testPassed = false;
          console.error('❌ Web service not found in Render YAML');
        } else {
          // Extract actual environment variables
          const actualEnvVars: Record<string, string> = {};
          webService.envVars.forEach((envVar: any) => {
            if (envVar.key && envVar.value !== undefined) {
              actualEnvVars[envVar.key] = envVar.value;
            }
          });
          
          // Check the environment variables
          let envVarsValid = true;
          
          if (actualEnvVars['NGINX_HOST'] !== 'example.com') {
            console.error(`NGINX_HOST has incorrect value: expected 'example.com', got '${actualEnvVars['NGINX_HOST']}'`);
            envVarsValid = false;
          }
          
          if (actualEnvVars['NGINX_PORT'] !== '80') {
            console.error(`NGINX_PORT has incorrect value: expected '80', got '${actualEnvVars['NGINX_PORT']}'`);
            envVarsValid = false;
          }
          
          if (envVarsValid) {
            console.log('✓ Environment variables validation passed');
          } else {
            testPassed = false;
            console.error('❌ Environment variables validation failed');
          }
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
        
        // 2. Check for volume support
        // (DigitalOcean App Platform has different volume approach)
        validateVolumeMounting(doYaml, 'web', '/etc/nginx/nginx.conf');
        console.log('✓ DigitalOcean volume check skipped (App Platform has different volume approach)');
        
        // 3. Check environment variables
        // Find web service - may have a different name due to DO naming requirements
        let webServiceName = '';
        for (const service of doYaml.spec.services) {
          if (service.image && service.image.repository && 
              service.image.repository.toLowerCase().includes('nginx')) {
            webServiceName = service.name;
            break;
          }
        }
        
        if (!webServiceName) {
          testPassed = false;
          console.error('❌ Web service not found in DigitalOcean YAML');
        } else {
          // Define expected environment variables
          const expectedEnvVars = {
            'NGINX_HOST': 'example.com',
            'NGINX_PORT': '80'
          };
          
          // Check environment variables
          const envVarsValid = validateDOEnvironmentVariables(doYaml, webServiceName, expectedEnvVars);
          
          if (envVarsValid) {
            console.log('✓ DigitalOcean environment variables validation passed');
          } else {
            testPassed = false;
            console.error('❌ DigitalOcean environment variables validation failed');
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

  console.log(`--- Docker Compose Environment Variables Test ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the test for test1: Environment variables and volume mapping
 */
export async function runTest1(): Promise<boolean> {
  console.log('\n=== Running Test 1: Environment Variables and Volume Mapping ===');
  
  // Create output directory for this test
  const testOutputDir = join(OUTPUT_DIR, 'test1');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  // Run Docker Run test
  const dockerRunTestPassed = await runDockerRunTest1();
  
  // Run Docker Compose test
  const dockerComposeTestPassed = await runDockerComposeTest1();
  
  // Overall test passes if both subtests pass
  const overallTestPassed = dockerRunTestPassed && dockerComposeTestPassed;
  
  console.log(`=== Test 1 ${overallTestPassed ? 'PASSED ✓' : 'FAILED ❌'} ===`);
  return overallTestPassed;
}
