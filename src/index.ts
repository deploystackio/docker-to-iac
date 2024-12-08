import { BaseParser, ParserInfo, TemplateFormat } from './parsers/base-parser';
import { ApplicationConfig } from './types/container-config';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import { createSourceParser } from './sources/factory';

// Add new types for our updated API
export type TranslateOptions = {
  source: 'compose' | 'run';
  target: string;
  templateFormat?: TemplateFormat;
};

// List of all available parsers
const parsers: BaseParser[] = [
  cloudFormationParserInstance,
  renderParserInstance,
  digitalOceanParserInstance,
];

function translate(content: string, options: TranslateOptions): any {
  try {
    const parser = parsers.find(
      p => p.getInfo().languageAbbreviation.toLowerCase() === options.target.toLowerCase()
    );
    
    if (!parser) {
      throw new Error(`Unsupported target language: ${options.target}`);
    }

    const sourceParser = createSourceParser(options.source);
    if (!sourceParser.validate(content)) {
      throw new Error(`Invalid ${options.source} content`);
    }

    const containerConfig = sourceParser.parse(content);
    const translatedConfig = parser.parse(containerConfig, options.templateFormat);
    
    return translatedConfig;
  } catch (e) {
    console.error(`Error translating content: ${e}`);
    throw e;
  }
}

function listServices(content: string, sourceType: 'compose' | 'run' = 'compose'): ApplicationConfig['services'] {
  try {
    const sourceParser = createSourceParser(sourceType);
    const config = sourceParser.parse(content);
    return config.services;
  } catch (e) {
    console.error(`Error listing services: ${e}`);
    throw e;
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
};