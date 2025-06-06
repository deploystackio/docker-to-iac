import { translate } from '../../src/index';
import { TemplateFormat } from '../../src/parsers/base-parser';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';
import { validateRenderSchema } from './utils/render-validator';

// Constants for directories
const DOCKER_RUN_DIR = join(__dirname, 'docker-run-files');
const DOCKER_COMPOSE_DIR = join(__dirname, 'docker-compose-files');
const OUTPUT_DIR = join(__dirname, 'output');
const RENDER_SCHEMA_URL = 'https://render.com/schema/render.yaml.json';

/**
 * Run the Docker Run test with schema validation.
 */
async function runDockerRunTest4(): Promise<boolean> {
  console.log('\n--- Running Docker Run Test 4 (Render Translation with Schema Validation) ---');

  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test4', 'docker-run', 'rnd');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;

  try {
    // Read and normalize the docker run command
    const dockerRunPath = join(DOCKER_RUN_DIR, 'test4.txt');
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

    // Save the main render.yaml file
    const renderYamlPath = join(testOutputDir, 'render.yaml');
    const renderFileData = renderTranslationResult.files['render.yaml'];

    if (!renderFileData) {
      throw new Error('render.yaml not found in translation result');
    }

    writeFileSync(renderYamlPath, renderFileData.content);
    console.log(`✓ Created Render output: render.yaml`);

    // Validate against Render.com schema
    const renderYaml = yaml.parse(renderFileData.content);
    console.log('Validating Render YAML against official schema...');
    const isValid = await validateRenderSchema(renderYaml, RENDER_SCHEMA_URL);
    if (!isValid) {
      testPassed = false;
      console.error('❌ Schema validation failed for Docker Run test');
    } else {
      console.log('✅ Schema validation passed for Docker Run test');
    }

  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`--- Docker Run Test 4 ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the Docker Compose test with schema validation.
 */
async function runDockerComposeTest4(): Promise<boolean> {
  console.log('\n--- Running Docker Compose Test 4 (Render Translation with Schema Validation) ---');

  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test4', 'docker-compose', 'rnd');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;

  try {
    // Read the docker compose file
    const dockerComposePath = join(DOCKER_COMPOSE_DIR, 'test4.yml');
    const composeContent = readFileSync(dockerComposePath, 'utf8');

    console.log('Testing Docker Compose translation to Render...');

    const renderTranslationResult = translate(composeContent, {
      source: 'compose',
      target: 'RND',
      templateFormat: TemplateFormat.yaml
    });

    // Save the main render.yaml file
    const renderYamlPath = join(testOutputDir, 'render.yaml');
    const renderFileData = renderTranslationResult.files['render.yaml'];

    if (!renderFileData) {
      throw new Error('render.yaml not found in translation result');
    }

    writeFileSync(renderYamlPath, renderFileData.content);
    console.log(`✓ Created Render output: render.yaml`);

    // Validate against Render.com schema
    const renderYaml = yaml.parse(renderFileData.content);
    console.log('Validating Render YAML against official schema...');
    const isValid = await validateRenderSchema(renderYaml, RENDER_SCHEMA_URL);
    if (!isValid) {
      testPassed = false;
      console.error('❌ Schema validation failed for Docker Compose test');
    } else {
      console.log('✅ Schema validation passed for Docker Compose test');
    }

  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`--- Docker Compose Test 4 ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the test for test4 with schema validation.
 */
export async function runTest4(): Promise<boolean> {
  console.log('\n=== Running Test 4: Render Translation with Schema Validation ===');

  // Create output directory for this test
  const testOutputDir = join(OUTPUT_DIR, 'test4');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  // Run Docker Run test
  const dockerRunTestPassed = await runDockerRunTest4();

  // Run Docker Compose test
  const dockerComposeTestPassed = await runDockerComposeTest4();

  // Overall test passes if both subtests pass
  const overallTestPassed = dockerRunTestPassed && dockerComposeTestPassed;

  console.log(`=== Test 4 ${overallTestPassed ? 'PASSED ✓' : 'FAILED ❌'} ===`);
  return overallTestPassed;
}
