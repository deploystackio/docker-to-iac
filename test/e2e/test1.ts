import { translate } from '../../src/index';
import { TemplateFormat } from '../../src/parsers/base-parser';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import * as yaml from 'yaml';
import { assertRenderYamlStructure, validateVolumeMappingInRender } from './assertions/render';

// Constants for directories
const DOCKER_RUN_DIR = join(__dirname, 'docker-run-files');
const OUTPUT_DIR = join(__dirname, 'output');

/**
 * Run the test for the test1 Docker run file
 */
export async function runTest1(): Promise<boolean> {
  console.log('\n=== Running Test 1: Environment Variables and Volume Mapping ===');
  
  // Create output directory for this test
  const testOutputDir = join(OUTPUT_DIR, 'test1');
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
    try {
      const translationResult = translate(command, {
        source: 'run',
        target: 'RND',
        templateFormat: TemplateFormat.yaml,
        environmentVariables: {} // No environment variables provided for this test
      });

      // Create directory for Render
      const renderOutputDir = join(testOutputDir, 'rnd');
      if (!existsSync(renderOutputDir)) {
        mkdirSync(renderOutputDir, { recursive: true });
      }

      // Save all files with proper directory structure
      Object.entries(translationResult.files).forEach(([path, fileData]) => {
        const fullPath = join(renderOutputDir, path);
        const dir = dirname(fullPath);
        
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        
        writeFileSync(fullPath, fileData.content);
        console.log(`✓ Created Render output: ${path}`);
      });

      // Run specific assertions for Render
      const renderYamlPath = join(renderOutputDir, 'render.yaml');
      if (existsSync(renderYamlPath)) {
        const renderYaml = yaml.parse(readFileSync(renderYamlPath, 'utf8'));
        
        // Run assertions for Render output
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
          
          // Check the environment variables manually instead of using the helper
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
    } catch (error) {
      testPassed = false;
      console.error('❌ Translation to Render failed:', error);
    }
  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`=== Test 1 ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ===`);
  return testPassed;
}
