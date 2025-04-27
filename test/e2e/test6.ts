import { translate } from '../../src/index';
import { TemplateFormat } from '../../src/parsers/base-parser';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Constants for directories
const DOCKER_RUN_DIR = join(__dirname, 'docker-run-files');
const DOCKER_COMPOSE_DIR = join(__dirname, 'docker-compose-files');
const OUTPUT_DIR = join(__dirname, 'output');

/**
 * Runs helm lint on the specified directory
 * @param chartDir Directory containing Helm chart
 * @returns Promise resolving to true if lint passed, false otherwise
 */
async function runHelmLint(chartDir: string): Promise<boolean> {
  try {
    console.log(`Running helm lint on ${chartDir}...`);
    const { stdout, stderr } = await execAsync(`helm lint ${chartDir}`);
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error(stderr);
      return false;
    }
    
    return stdout.includes('0 chart(s) failed') || stdout.includes('1 chart(s) passed');
  } catch (error: any) {
    console.error('Helm lint failed with error:', error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

/**
 * Checks if helm is installed
 * @returns Promise resolving to true if helm is installed
 */
async function isHelmInstalled(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('helm version --short');
    console.log(`Detected Helm version: ${stdout.trim()}`);
    return true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.error('Helm is not installed or not available in PATH');
    return false;
  }
}

/**
 * Run the Docker Run test with Helm linting.
 */
async function runDockerRunTest6(): Promise<boolean> {
  console.log('\n--- Running Docker Run Test 6 (Helm Linting) ---');

  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test6', 'docker-run', 'helm');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;

  try {
    // Read and normalize the docker run command
    const dockerRunPath = join(DOCKER_RUN_DIR, 'test6.txt');
    const command = readFileSync(dockerRunPath, 'utf8')
      .replace(/\\\n/g, ' ')  // Remove line continuations
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();                // Remove leading/trailing whitespace

    console.log(`Running test for command: ${command}`);

    // Test translation to Helm
    console.log('Testing translation to Helm...');

    const helmTranslationResult = translate(command, {
      source: 'run',
      target: 'HELM',
      templateFormat: TemplateFormat.yaml
    });

    // Save all files with proper directory structure
    Object.entries(helmTranslationResult.files).forEach(([path, fileData]) => {
      const fullPath = join(testOutputDir, path);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, fileData.content);
      console.log(`✓ Created Helm output: ${path}`);
    });

    // Run helm lint on the directory
    if (await isHelmInstalled()) {
      const lintPassed = await runHelmLint(testOutputDir);
      if (!lintPassed) {
        testPassed = false;
        console.error('❌ Helm lint failed for Docker Run test');
      } else {
        console.log('✅ Helm lint passed for Docker Run test');
      }
    } else {
      console.warn('⚠️ Helm is not installed, skipping lint test');
      // Don't fail the test if Helm is not installed
    }

  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`--- Docker Run Test 6 ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the Docker Compose test with Helm linting.
 */
async function runDockerComposeTest6(): Promise<boolean> {
  console.log('\n--- Running Docker Compose Test 6 (Helm Linting) ---');

  // Create output directory for this subtest
  const testOutputDir = join(OUTPUT_DIR, 'test6', 'docker-compose', 'helm');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  let testPassed = true;

  try {
    // Read the docker compose file
    const dockerComposePath = join(DOCKER_COMPOSE_DIR, 'test6.yml');
    const composeContent = readFileSync(dockerComposePath, 'utf8');

    console.log('Testing Docker Compose translation to Helm...');

    const helmTranslationResult = translate(composeContent, {
      source: 'compose',
      target: 'HELM',
      templateFormat: TemplateFormat.yaml
    });

    // Save all files with proper directory structure
    Object.entries(helmTranslationResult.files).forEach(([path, fileData]) => {
      const fullPath = join(testOutputDir, path);
      const dir = dirname(fullPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      writeFileSync(fullPath, fileData.content);
      console.log(`✓ Created Helm output: ${path}`);
    });

    // Run helm lint on the directory
    if (await isHelmInstalled()) {
      const lintPassed = await runHelmLint(testOutputDir);
      if (!lintPassed) {
        testPassed = false;
        console.error('❌ Helm lint failed for Docker Compose test');
      } else {
        console.log('✅ Helm lint passed for Docker Compose test');
      }
    } else {
      console.warn('⚠️ Helm is not installed, skipping lint test');
      // Don't fail the test if Helm is not installed
    }

  } catch (error) {
    testPassed = false;
    console.error('❌ Test execution error:', error);
  }

  console.log(`--- Docker Compose Test 6 ${testPassed ? 'PASSED ✓' : 'FAILED ❌'} ---`);
  return testPassed;
}

/**
 * Run the test for test6 with Helm linting.
 */
export async function runTest6(): Promise<boolean> {
  console.log('\n=== Running Test 6: Helm Chart Linting ===');

  // Create output directory for this test
  const testOutputDir = join(OUTPUT_DIR, 'test6');
  if (!existsSync(testOutputDir)) {
    mkdirSync(testOutputDir, { recursive: true });
  }

  // Run Docker Run test
  const dockerRunTestPassed = await runDockerRunTest6();

  // Run Docker Compose test
  const dockerComposeTestPassed = await runDockerComposeTest6();

  // Overall test passes if both subtests pass
  const overallTestPassed = dockerRunTestPassed && dockerComposeTestPassed;

  console.log(`=== Test 6 ${overallTestPassed ? 'PASSED ✓' : 'FAILED ❌'} ===`);
  return overallTestPassed;
}
