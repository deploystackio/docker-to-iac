import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Main test dispatcher
 * 
 * This file serves as the entry point for running all tests.
 * It dispatches to the relevant test suites based on what's being tested.
 */
async function runTests() {
  console.log('=== Starting Tests ===');
  
  try {
    // Run the E2E tests as a separate process
    console.log('\n=== Running End-to-End Tests ===');
    
    try {
      // Execute the E2E tests using ts-node
      const { stdout, stderr } = await execAsync('ts-node test/e2e/index.ts');
      
      if (stdout) {
        console.log(stdout);
      }
      
      if (stderr) {
        console.error(stderr);
        process.exit(1);
      }
      
      console.log('\n=== All Tests Completed Successfully ===');
    } catch (error: any) {
      // Type assertion for the error object
      if (error && typeof error === 'object' && 'stdout' in error) {
        console.log(error.stdout);
      }
      
      if (error && typeof error === 'object' && 'stderr' in error) {
        console.error(error.stderr);
      } else {
        console.error('Error running E2E tests:', error);
      }
      
      console.error('E2E tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run all tests
runTests().catch(error => {
  console.error('Unexpected error running tests:', error);
  process.exit(1);
});
