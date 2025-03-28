import { translate, getParserInfo, listAllParsers, listServices } from '../src/index';
import { TemplateFormat } from '../src/parsers/base-parser';
import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

// Track test failures
let hasTestFailed = false;

// Constants for directories
const ENV_CONFIG_DIR = join(__dirname, 'environment-variable-config');
const DOCKER_COMPOSE_DIR = join(__dirname, 'docker-compose-files');
const DOCKER_RUN_DIR = join(__dirname, 'docker-run-files');  // New directory for docker run files
const OUTPUT_DIR = join(__dirname, 'output');
const DOCKER_RUN_OUTPUT_DIR = join(OUTPUT_DIR, 'docker-run');
const DOCKER_COMPOSE_OUTPUT_DIR = join(OUTPUT_DIR, 'docker-compose');

[OUTPUT_DIR, DOCKER_RUN_OUTPUT_DIR, DOCKER_COMPOSE_OUTPUT_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
});

[OUTPUT_DIR, DOCKER_RUN_OUTPUT_DIR, DOCKER_COMPOSE_OUTPUT_DIR, ENV_CONFIG_DIR].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir);
  }
});

function loadEnvironmentConfigs(): Record<string, any> {
  const envConfigFiles = readdirSync(ENV_CONFIG_DIR)
    .filter(file => file.endsWith('.json'));

  if (envConfigFiles.length === 0) {
    console.log('ℹ️ No environment config files found in test/environment-variable-config');
    return {};
  }

  return envConfigFiles.reduce((configs, filename) => {
    try {
      const content = readFileSync(join(ENV_CONFIG_DIR, filename), 'utf8');
      const config = JSON.parse(content);
      return { ...configs, ...config };
    } catch (error) {
      console.error(`❌ Error loading environment config from ${filename}:`, error);
      hasTestFailed = true;
      return configs;
    }
  }, {});
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

// Process Docker Run Files
console.log('\n=== Processing Docker Run Files ===');

// Get all docker run files
const dockerRunFiles = readdirSync(DOCKER_RUN_DIR)
  .filter(file => file.endsWith('.txt') || file.endsWith('.sh'));

if (dockerRunFiles.length === 0) {
  console.error('❌ No docker run files found in test/docker-run-files');
  hasTestFailed = true;
}

const environmentConfigs = loadEnvironmentConfigs();

// Process each docker run file
dockerRunFiles.forEach((filename) => {
  console.log(`\n=== Processing Docker Run File ${filename} ===`);
  
  // Create output directory for this command
  const commandOutputDir = join(DOCKER_RUN_OUTPUT_DIR, filename.replace(/\.(txt|sh)$/, ''));
  if (!existsSync(commandOutputDir)) {
    mkdirSync(commandOutputDir);
  }

  // Read and process the docker run command
  const command = readFileSync(join(DOCKER_RUN_DIR, filename), 'utf8')
    .replace(/\\\n/g, ' ')  // Remove line continuations
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim();                // Remove leading/trailing whitespace

  // Test listServices for each command
  console.log(`\nTesting listServices for Docker Run File ${filename}`);
  try {
    const services = listServices(command, {
      source: 'run',
      environmentVariableGeneration: environmentConfigs
    });
    console.log('✓ Services found:', services);
    writeFileSync(
      join(commandOutputDir, 'services.json'),
      JSON.stringify(services, null, 2)
    );
  } catch (error) {
    console.error(`❌ Failed to list services for Docker Run File ${filename}:`, error);
    hasTestFailed = true;
  }

  // Test each parser with each format for docker run
  parsers.forEach(parser => {
    console.log(`\nTesting ${parser.providerName} parser for Docker Run Command`);
    const parserOutputDir = join(commandOutputDir, parser.languageAbbreviation.toLowerCase());
    
    if (!existsSync(parserOutputDir)) {
      mkdirSync(parserOutputDir);
    }

    // Test all template formats
    Object.values(TemplateFormat).forEach(format => {
      try {
        const result = translate(command, {
          source: 'run',
          target: parser.languageAbbreviation,
          templateFormat: format as TemplateFormat,
          environmentVariableGeneration: environmentConfigs
        });
      
        // Save all generated files with proper directory structure
        Object.entries(result.files).forEach(([path, fileData]) => {
          // Create the full directory path
          const fullPath = join(parserOutputDir, path);
          const dir = dirname(fullPath);
          
          // Create directories if they don't exist
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          
          // Write the file with proper format
          writeFileSync(fullPath, fileData.content);
        });
        
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

// Process Docker Compose Files
console.log('\n=== Processing Docker Compose Files ===');

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
  
  // Create output directory for this file
  const fileOutputDir = join(DOCKER_COMPOSE_OUTPUT_DIR, filename.replace(/\.(yml|yaml)$/, ''));
  if (!existsSync(fileOutputDir)) {
    mkdirSync(fileOutputDir);
  }

  // Read docker-compose content
  const dockerComposeContent = readFileSync(join(DOCKER_COMPOSE_DIR, filename), 'utf8');

  // Test listServices for each file
  console.log(`\nTesting listServices for ${filename}`);
  try {
    const services = listServices(dockerComposeContent, {
      source: 'compose',
      environmentVariableGeneration: environmentConfigs
    });    
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
        const result = translate(dockerComposeContent, {
          source: 'compose',
          target: parser.languageAbbreviation,
          templateFormat: format as TemplateFormat,
          environmentVariableGeneration: environmentConfigs
        });
      
        // Save all generated files with proper directory structure
        Object.entries(result.files).forEach(([path, fileData]) => {
          // Create the full directory path
          const fullPath = join(parserOutputDir, path);
          const dir = dirname(fullPath);
          
          // Create directories if they don't exist
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          
          // Write the file with proper format
          writeFileSync(fullPath, fileData.content);
        });
        
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
