import { translate } from '../../src/index';
import { TemplateFormat } from '../../src/parsers/base-parser';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { assertRenderYamlStructure } from './assertions/render';
import { assertDigitalOceanYamlStructure } from './assertions/digitalocean';
import { validatePortMappingInDigitalOcean } from './assertions/do-port-assertions';
import { validatePortMappingInRender } from './assertions/port-assertions';

// Constants for directories
const OUTPUT_DIR = join(__dirname, 'output');

/**
 * Run the Docker run command test for Portkey Gateway
 */
async function runDockerRunPortkeyTest(): Promise<boolean> {
  console.log('\n--- Running Docker Run Portkey Gateway Test ---');
  
  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test5', 'docker-run');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;
  
  try {
    // The docker run command
    const command = 'docker run --rm -p 8787:8787 portkeyai/gateway:latest';

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
        
        // 2. Check for port mapping
        const portMappingValid = validatePortMappingInRender(renderYaml, 'default', 8787);
        if (portMappingValid) {
          console.log('✓ Port mapping validation passed');
        } else {
          testPassed = false;
          console.error('❌ Port mapping validation failed');
        }
        
        // 3. Check image URL is correct
        const defaultService = renderYaml.services.find((svc: any) => svc.name === 'default');
        if (!defaultService) {
          testPassed = false;
          console.error('❌ Default service not found in Render YAML');
        } else {
          const imageUrl = defaultService.image?.url;
          if (imageUrl && imageUrl.includes('portkeyai/gateway:latest')) {
            console.log('✓ Image URL validation passed');
          } else {
            testPassed = false;
            console.error(`❌ Image URL validation failed: expected 'portkeyai/gateway:latest', got '${imageUrl}'`);
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
        
        // In DigitalOcean, the http_port should be set to 8787
        const portMappingValid = validatePortMappingInDigitalOcean(doYaml, serviceName, 8787);
        if (portMappingValid) {
          console.log('✓ DigitalOcean port mapping validation passed');
        } else {
          testPassed = false;
          console.error('❌ DigitalOcean port mapping validation failed');
        }
        
        // 3. Check image repository and tag are correct
        const service = doYaml.spec.services[0];
        if (!service.image) {
          testPassed = false;
          console.error('❌ Service image not found in DigitalOcean YAML');
        } else {
          const { registry, repository, tag } = service.image;
          
          // DigitalOcean splits the image into registry and repository
          if (registry === 'portkeyai' && repository === 'gateway' && tag === 'latest') {
            console.log('✓ Image repository and tag validation passed');
          } else {
            testPassed = false;
            console.error(`❌ Image validation failed: expected 'portkeyai/gateway:latest', got registry='${registry}', repository='${repository}', tag='${tag}'`);
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

  console.log(`--- Docker Run Portkey Gateway Test ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the Docker Compose test for Portkey Gateway
 */
async function runDockerComposePortkeyTest(): Promise<boolean> {
  console.log('\n--- Running Docker Compose Portkey Gateway Test ---');
  
  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test5', 'docker-compose');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;
  
  try {
    // Create docker-compose.yml content equivalent to the docker run command
    const dockerComposeContent = `
version: '3'
services:
  portkey:
    image: portkeyai/gateway:latest
    ports:
      - "8787:8787"
`;

    console.log('Testing Docker Compose translation to Render...');
    
    const renderTranslationResult = translate(dockerComposeContent, {
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
        
        // 2. Check for port mapping
        const portMappingValid = validatePortMappingInRender(renderYaml, 'portkey', 8787);
        if (portMappingValid) {
          console.log('✓ Port mapping validation passed');
        } else {
          testPassed = false;
          console.error('❌ Port mapping validation failed');
        }
        
        // 3. Check image URL is correct
        const portkeyService = renderYaml.services.find((svc: any) => svc.name === 'portkey');
        if (!portkeyService) {
          testPassed = false;
          console.error('❌ Portkey service not found in Render YAML');
        } else {
          const imageUrl = portkeyService.image?.url;
          if (imageUrl && imageUrl.includes('portkeyai/gateway:latest')) {
            console.log('✓ Image URL validation passed');
          } else {
            testPassed = false;
            console.error(`❌ Image URL validation failed: expected 'portkeyai/gateway:latest', got '${imageUrl}'`);
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
    
    const doTranslationResult = translate(dockerComposeContent, {
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
        
        // 2. Check for port mapping
        // Find portkey service - DigitalOcean may normalize service names
        let portkeyServiceName = '';

        for (const service of doYaml.spec.services) {
          // Check http_port
          if (service.http_port === 8787) {
            portkeyServiceName = service.name;
            console.log(`Found service with correct port: ${portkeyServiceName}`);
            break;
          }
          
          // Check image details
          if (service.image && 
              service.image.registry === 'portkeyai' && 
              service.image.repository === 'gateway') {
            portkeyServiceName = service.name;
            console.log(`Found service with gateway image: ${portkeyServiceName}`);
            break;
          }
        }

        // If we didn't find a service by specific criteria, just use the first service
        if (!portkeyServiceName && doYaml.spec.services.length > 0) {
          portkeyServiceName = doYaml.spec.services[0].name;
          console.log(`Using first service as fallback: ${portkeyServiceName}`);
        }
        
        if (!portkeyServiceName) {
          testPassed = false;
          console.error('❌ Portkey service not found in DigitalOcean YAML');
        } else {
          // Validate port mapping
          const portMappingValid = validatePortMappingInDigitalOcean(doYaml, portkeyServiceName, 8787);
          
          if (portMappingValid) {
            console.log('✓ DigitalOcean port mapping validation passed');
          } else {
            testPassed = false;
            console.error('❌ DigitalOcean port mapping validation failed');
          }
          
          // 3. Check image repository and tag are correct
          const service = doYaml.spec.services.find((svc: any) => svc.name === portkeyServiceName);
          if (!service || !service.image) {
            testPassed = false;
            console.error('❌ Service image not found in DigitalOcean YAML');
          } else {
            const { registry, repository, tag } = service.image;
            
            // DigitalOcean splits the image into registry and repository
            if (registry === 'portkeyai' && repository === 'gateway' && tag === 'latest') {
              console.log('✓ Image repository and tag validation passed');
            } else {
              testPassed = false;
              console.error(`❌ Image validation failed: expected 'portkeyai/gateway:latest', got registry='${registry}', repository='${repository}', tag='${tag}'`);
            }
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

  console.log(`--- Docker Compose Portkey Gateway Test ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the test for test5: Portkey Gateway port and image verification
 */
export async function runTest5(): Promise<boolean> {
  console.log('\n=== Running Test 5: Portkey Gateway Port and Image Verification ===');
  
  // Create output directory for this test
  const testOutputDir = join(OUTPUT_DIR, 'test5');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  // Run Docker Run test
  const dockerRunTestPassed = await runDockerRunPortkeyTest();
  
  // Run Docker Compose test
  const dockerComposeTestPassed = await runDockerComposePortkeyTest();
  
  // Overall test passes if both subtests pass
  const overallTestPassed = dockerRunTestPassed && dockerComposeTestPassed;
  
  console.log(`=== Test 5 ${overallTestPassed ? 'PASSED ✓' : 'FAILED ❌'} ===`);
  return overallTestPassed;
}
