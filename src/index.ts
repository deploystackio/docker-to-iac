import * as YAML from 'yaml';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import { BaseParser, ParserInfo, TemplateFormat } from './parsers/base-parser';

// List of all available parsers
const parsers: BaseParser[] = [
  cloudFormationParserInstance,
  renderParserInstance,
  digitalOceanParserInstance,
  // Add new parsers here in the future as needed
];

function translate(dockerComposeContent: string, languageAbbreviation: string, templateFormat?: TemplateFormat): any {
  try {
    const dockerCompose = YAML.parse(dockerComposeContent) as any;

    const parser = parsers.find(parser => parser.getInfo().languageAbbreviation.toLowerCase() === languageAbbreviation.toLowerCase());
    if (!parser) {
      throw new Error(`Unsupported target language: ${languageAbbreviation}`);
    }

    const translatedConfig = parser.parse(dockerCompose, templateFormat);
    return translatedConfig;
  } catch (e) {
    console.error(`Error translating docker-compose content: ${e}`);
    return null;
  }
}

function getParserInfo(languageAbbreviation: string): ParserInfo {
  const parser = parsers.find(parser => parser.getInfo().languageAbbreviation.toLowerCase() === languageAbbreviation.toLowerCase());
  if (!parser) {
    throw new Error(`Unsupported target language: ${languageAbbreviation}`);
  }
  return parser.getInfo();
}

function listAllParsers(): ParserInfo[] {
  return parsers.map(parser => parser.getInfo());
}

export { translate, getParserInfo, listAllParsers };
