import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { runTest1 } from './test1';
import { runTest2 } from './test2';

// Constants for directories
const OUTPUT_DIR = join(__dirname, 'output');

// Create output directory if it doesn't exist
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Track test results
interface TestResult {
  testName: string;
  passed: boolean;
}

const testResults: TestResult[] = [];

/**
 * Run all end-to-end tests
 */
async function runAllTests() {
  console.log('=== Starting E2E Tests ===');
  
  // Run Test 1: Environment variables and volume mapping
  const test1Passed = await runTest1();
  testResults.push({ testName: 'Test 1: Environment Variables and Volume Mapping', passed: test1Passed });

  // Run Test 2: Port Mappings
  const test2Passed = await runTest2();
  testResults.push({ testName: 'Test 2: Port Mappings', passed: test2Passed });

  // Add more tests here as they are created
  // e.g. const test3Passed = await runTest3();
  // testResults.push({ testName: 'Test 3 Description', passed: test3Passed });

  // Print summary
  console.log('\n=== Test Summary ===');
  const passedTests = testResults.filter(r => r.passed);
  console.log(`Total tests: ${testResults.length}`);
  console.log(`Passed: ${passedTests.length}`);
  console.log(`Failed: ${testResults.length - passedTests.length}`);

  // Print failed tests
  if (testResults.length - passedTests.length > 0) {
    console.log('\nFailed Tests:');
    testResults.filter(r => !r.passed).forEach(test => {
      console.log(`- ${test.testName}`);
    });
    
    // Exit with error code if any test failed
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
