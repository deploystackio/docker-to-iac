import { translate, getParserInfo, listAllParsers, listServices } from '../src/index';
import { TemplateFormat } from '../src/parsers/base-parser';
import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Track test failures
let hasTestFailed = false;

// Constants for directories
const DOCKER_COMPOSE_DIR = join(__dirname, 'docker-compose-files');
const OUTPUT_DIR = join(__dirname, 'output');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR);
}

// Test listAllParsers functionality
console.log('\n=== Testing listAllParsers ===');
const parsers = listAllParsers();
if (!parsers || parsers.length === 0) {
  console.error('❌ No parsers found');
  hasTestFailed = true;
} else {
  console.log('✓ Available Parsers:', parsers);
}

// Test getParserInfo for each parser
console.log('\n=== Testing getParserInfo for each parser ===');
parsers.forEach(parser => {
  try {
    const parserInfo = getParserInfo(parser.languageAbbreviation);
    console.log(`✓ Parser Info for ${parser.providerName}:`, parserInfo);
  } catch (error) {
    console.error(`❌ Failed to get parser info for ${parser.providerName}:`, error);
    hasTestFailed = true;
  }
});

// Get all docker-compose files
const dockerComposeFiles = readdirSync(DOCKER_COMPOSE_DIR)
  .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

if (dockerComposeFiles.length === 0) {
  console.error('❌ No docker-compose files found in test/docker-compose-files');
  hasTestFailed = true;
}

// Process each docker-compose file
dockerComposeFiles.forEach(filename => {
  console.log(`\n=== Processing ${filename} ===`);
  
  // Create output directory for this file if it doesn't exist
  const fileOutputDir = join(OUTPUT_DIR, filename.replace(/\.(yml|yaml)$/, ''));
  if (!existsSync(fileOutputDir)) {
    mkdirSync(fileOutputDir);
  }

  // Read docker-compose content
  const dockerComposeContent = readFileSync(join(DOCKER_COMPOSE_DIR, filename), 'utf8');

  // Test listServices for each file
  console.log(`\nTesting listServices for ${filename}`);
  try {
    const services = listServices(dockerComposeContent);
    console.log('✓ Services found:', services);
    writeFileSync(
      join(fileOutputDir, 'services.json'), 
      JSON.stringify(services, null, 2)
    );
  } catch (error) {
    console.error(`❌ Failed to list services for ${filename}:`, error);
    hasTestFailed = true;
  }

  // Test each parser with each format
  parsers.forEach(parser => {
    console.log(`\nTesting ${parser.providerName} parser`);
    const parserOutputDir = join(fileOutputDir, parser.languageAbbreviation.toLowerCase());
    
    if (!existsSync(parserOutputDir)) {
      mkdirSync(parserOutputDir);
    }

    // Test all template formats
    Object.values(TemplateFormat).forEach(format => {
      try {
        const result = translate(dockerComposeContent, parser.languageAbbreviation, format as TemplateFormat);
        const extension = format === TemplateFormat.yaml ? 'yml' : format;
        const outputPath = join(parserOutputDir, `output.${extension}`);
        
        if (format === TemplateFormat.json) {
          // Handle JSON format
          let jsonContent;
          try {
            jsonContent = JSON.parse(result);
          } catch {
            // If parsing fails, it might already be an object
            jsonContent = result;
          }
          
          // Ensure we're writing a string
          const jsonString = typeof jsonContent === 'string' 
            ? jsonContent 
            : JSON.stringify(jsonContent, null, 2);
            
          writeFileSync(outputPath, jsonString);
        } else {
          writeFileSync(outputPath, result);
        }
        
        console.log(`✓ Successfully generated ${format} output for ${parser.providerName}`);
      } catch (error) {
        console.error(`❌ Error generating ${format} output for ${parser.providerName}:`, error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        hasTestFailed = true;
      }
    });
  });
});

console.log('\n=== Test execution completed ===');

// Exit with error if any test failed
if (hasTestFailed) {
  console.error('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✓ All tests passed successfully');
  process.exit(0);
}
