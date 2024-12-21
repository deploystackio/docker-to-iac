import { BaseParser, ParserInfo, TemplateFormat } from './parsers/base-parser';
import { ApplicationConfig } from './types/container-config';
import { EnvironmentVariableGenerationConfig } from './types/environment-config';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import { createSourceParser } from './sources/factory';
import { parseEnvFile } from './utils/parseEnvFile';

// Store for generated configurations
type ProcessedConfigStore = {
  config: ApplicationConfig;
  content: string;
  envConfig: EnvironmentVariableGenerationConfig | null;
  envVariables: Record<string, string> | null;
};

const processedConfigs = new Map<string, ProcessedConfigStore>();

export type TranslateOptions = {
  source: 'compose' | 'run';
  target: string;
  templateFormat?: TemplateFormat;
  environmentVariableGeneration?: EnvironmentVariableGenerationConfig;
  environmentVariables?: Record<string, string>;
  persistenceKey?: string; // New optional parameter for persistence
};

const parsers: BaseParser[] = [
  cloudFormationParserInstance,
  renderParserInstance,
  digitalOceanParserInstance,
];

function getProcessedConfig(
  content: string, 
  sourceType: 'compose' | 'run', 
  options: {
    envGeneration?: EnvironmentVariableGenerationConfig;
    envVariables?: Record<string, string>;
    persistenceKey?: string;
  }
): ApplicationConfig {
  const { persistenceKey } = options;

  // If persistence key is provided, try to get stored config
  if (persistenceKey) {
    const stored = processedConfigs.get(persistenceKey);
    if (stored && 
        stored.content === content && 
        JSON.stringify(stored.envConfig) === JSON.stringify(options.envGeneration) &&
        JSON.stringify(stored.envVariables) === JSON.stringify(options.envVariables)) {
      return stored.config;
    }
  }

  // Process the configuration
  const sourceParser = createSourceParser(sourceType);
  if (!sourceParser.validate(content)) {
    throw new Error(`Invalid ${sourceType} content`);
  }

  // Parse and process environment variables
  const processedConfig = sourceParser.parse(content, {
    environmentGeneration: options.envGeneration,
    environmentVariables: options.envVariables
  });

  // Store the processed config if persistence key is provided
  if (persistenceKey) {
    processedConfigs.set(persistenceKey, {
      config: processedConfig,
      content,
      envConfig: options.envGeneration || null,
      envVariables: options.envVariables || null
    });
  }

  return processedConfig;
}

function translate(content: string, options: TranslateOptions): any {
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

    const translatedConfig = parser.parse(containerConfig, options.templateFormat);
    return translatedConfig;
  } catch (e) {
    console.error(`Error translating content: ${e}`);
    throw e;
  }
}

function listServices(
  content: string, 
  sourceType: 'compose' | 'run' = 'compose', 
  environmentGeneration?: EnvironmentVariableGenerationConfig,
  persistenceKey?: string
): ApplicationConfig['services'] {
  try {
    const config = getProcessedConfig(content, sourceType, {
      envGeneration: environmentGeneration,
      persistenceKey
    });
    return config.services;
  } catch (e) {
    console.error(`Error listing services: ${e}`);
    throw e;
  }
}

// Function to clear stored configurations
function clearStoredConfigs(persistenceKey?: string): void {
  if (persistenceKey) {
    processedConfigs.delete(persistenceKey);
  } else {
    processedConfigs.clear();
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
  clearStoredConfigs,
};
