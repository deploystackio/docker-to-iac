import { BaseParser, ParserInfo, formatResponse } from './parsers/base-parser';
import { ApplicationConfig, TranslationResult } from './types/container-config';
import type { ListServicesOptions, TranslateOptions } from './types/container-config';
import { EnvironmentVariableGenerationConfig } from './types/environment-config';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import helmParserInstance from './parsers/helm';
import { createSourceParser } from './sources/factory';
import { parseEnvFile } from './utils/parseEnvFile';
import { resolveServiceConnections } from './utils/resolveServiceConnections';
import { generateDatabaseServiceConnections } from './utils/detectDatabaseEnvVars';

// Store for generated environment variables
const generatedEnvVars = new Map<string, Record<string, Record<string, string>>>();

const parsers: BaseParser[] = [
  cloudFormationParserInstance,
  renderParserInstance,
  digitalOceanParserInstance,
  helmParserInstance,
];

function getOrCreateEnvVars(
  serviceName: string,
  imageConfig: any,
  envGeneration?: EnvironmentVariableGenerationConfig,
  persistenceKey?: string
): Record<string, string> {
  if (!persistenceKey) {
    return {};
  }

  // Get or initialize service-level storage
  if (!generatedEnvVars.has(persistenceKey)) {
    generatedEnvVars.set(persistenceKey, {});
  }
  const keyStore = generatedEnvVars.get(persistenceKey)!;
  
  // Return existing variables if already generated
  if (keyStore[serviceName]) {
    return keyStore[serviceName];
  }

  // Store will be populated by the source parser
  keyStore[serviceName] = {};
  return keyStore[serviceName];
}

function getProcessedConfig(
  content: string, 
  sourceType: 'compose' | 'run', 
  options: {
    envGeneration?: EnvironmentVariableGenerationConfig;
    envVariables?: Record<string, string>;
    persistenceKey?: string;
  }
): ApplicationConfig {
  const sourceParser = createSourceParser(sourceType);
  if (!sourceParser.validate(content)) {
    throw new Error(`Invalid ${sourceType} content`);
  }

  // Inject the environment variable getter
  const envVarGetter = (serviceName: string, imageConfig: any) => 
    getOrCreateEnvVars(serviceName, imageConfig, options.envGeneration, options.persistenceKey);

  // Parse with environment variable persistence
  return sourceParser.parse(content, {
    environmentGeneration: options.envGeneration,
    environmentVariables: options.envVariables,
    getPersistedEnvVars: envVarGetter,
    setPersistedEnvVars: (serviceName: string, vars: Record<string, string>) => {
      if (options.persistenceKey) {
        const keyStore = generatedEnvVars.get(options.persistenceKey)!;
        keyStore[serviceName] = vars;
      }
    }
  });
}

function translate(content: string, options: TranslateOptions): TranslationResult {
  try {
    const parser = parsers.find(
      p => p.getInfo().languageAbbreviation.toLowerCase() === options.target.toLowerCase()
    );
    
    if (!parser) {
      throw new Error(`Unsupported target language: ${options.target}`);
    }

    const containerConfig = getProcessedConfig(content, options.source, {
      envGeneration: options.environmentVariableGeneration,
      envVariables: options.environmentVariables,
      persistenceKey: options.persistenceKey
    });

    // Process service connections if provided
    let resolvedServiceConnections;
    
    if (options.serviceConnections && options.serviceConnections.mappings.length > 0) {
      // Use the simplified service connection resolver - no provider-specific transformations
      resolvedServiceConnections = resolveServiceConnections(
        containerConfig,
        options.serviceConnections
      );
      
      // Add service connections to the container config for parsers to use
      containerConfig.serviceConnections = resolvedServiceConnections;
    } else if (options.target.toLowerCase() !== 'cfn') {
      // Auto-detect database connections if not AWS CloudFormation
      // (CloudFormation doesn't support direct service-to-service references)
      const autoDetectedMappings = generateDatabaseServiceConnections(containerConfig);
      
      if (autoDetectedMappings.length > 0) {
        // Process auto-detected connections
        resolvedServiceConnections = resolveServiceConnections(
          containerConfig,
          { mappings: autoDetectedMappings }
        );
        
        // Add to container config
        containerConfig.serviceConnections = resolvedServiceConnections;
      }
    }

    // Get files from parser
    const filesOutput = parser.parseFiles(containerConfig);
    const result: TranslationResult = { 
      files: {},
      serviceConnections: resolvedServiceConnections
    };
    
    // Process each file to ensure correct formatting
    for (const [path, fileData] of Object.entries(filesOutput)) {
      result.files[path] = {
        content: typeof fileData.content === 'string' 
          ? fileData.content 
          : formatResponse(JSON.stringify(fileData.content, null, 2), fileData.format),
        format: fileData.format,
        isMain: fileData.isMain
      };
    }
    
    return result;
  } catch (e) {
    console.error(`Error translating content: ${e}`);
    throw e;
  }
}

function listServices(content: string, options: ListServicesOptions): ApplicationConfig['services'] {
  try {
    const config = getProcessedConfig(content, options.source, {
      envGeneration: options.environmentVariableGeneration,
      envVariables: options.environmentVariables,
      persistenceKey: options.persistenceKey
    });
    return config.services;
  } catch (e) {
    console.error(`Error listing services: ${e}`);
    throw e;
  }
}

function clearStoredEnvVars(persistenceKey?: string): void {
  if (persistenceKey) {
    generatedEnvVars.delete(persistenceKey);
  } else {
    generatedEnvVars.clear();
  }
}

function getParserInfo(languageAbbreviation: string): ParserInfo {
  const parser = parsers.find(
    parser => parser.getInfo().languageAbbreviation.toLowerCase() === languageAbbreviation.toLowerCase()
  );
  if (!parser) {
    throw new Error(`Unsupported target language: ${languageAbbreviation}`);
  }
  return parser.getInfo();
}

function listAllParsers(): ParserInfo[] {
  return parsers.map(parser => parser.getInfo());
}

export { 
  translate,
  getParserInfo, 
  listAllParsers,
  listServices,
  parseEnvFile,
  clearStoredEnvVars
};
