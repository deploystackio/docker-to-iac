import { BaseParser, ParserInfo, TemplateFormat } from './parsers/base-parser';
import { ApplicationConfig } from './types/container-config';
import { EnvironmentVariableGenerationConfig } from './types/environment-config';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import { createSourceParser } from './sources/factory';
import { parseEnvFile } from './utils/parseEnvFile';

// Store for generated environment variables
const generatedEnvVars = new Map<string, Record<string, Record<string, string>>>();

export type TranslateOptions = {
  source: 'compose' | 'run';
  target: string;
  templateFormat?: TemplateFormat;
  environmentVariableGeneration?: EnvironmentVariableGenerationConfig;
  environmentVariables?: Record<string, string>;
  persistenceKey?: string;
};

const parsers: BaseParser[] = [
  cloudFormationParserInstance,
  renderParserInstance,
  digitalOceanParserInstance,
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
  clearStoredEnvVars,
};
