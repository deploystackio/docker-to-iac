import { translate, getParserInfo, listAllParsers, listServices } from '../src/index';
import { TemplateFormat } from '../src/parsers/base-parser';
import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

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
console.log('Available Parsers:', parsers);

// Test getParserInfo for each parser
console.log('\n=== Testing getParserInfo for each parser ===');
parsers.forEach(parser => {
  const parserInfo = getParserInfo(parser.languageAbbreviation);
  console.log(`Parser Info for ${parser.providerName}:`, parserInfo);
});

// Get all docker-compose files
const dockerComposeFiles = readdirSync(DOCKER_COMPOSE_DIR)
  .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

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
  const services = listServices(dockerComposeContent);
  console.log('Services found:', services);
  writeFileSync(
    join(fileOutputDir, 'services.json'), 
    JSON.stringify(services, null, 2)
  );

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
        console.error(`✗ Error generating ${format} output for ${parser.providerName}:`, error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      }
    });
  });
});

console.log('\n=== Test execution completed ===');
