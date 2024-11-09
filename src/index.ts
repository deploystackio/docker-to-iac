import * as YAML from 'yaml';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import { BaseParser, ParserInfo, TemplateFormat, DockerCompose, DockerComposeService, DockerComposeValidationError } from './parsers/base-parser';

// List of all available parsers
const parsers: BaseParser[] = [
  cloudFormationParserInstance,
  renderParserInstance,
  digitalOceanParserInstance,
  // Add new parsers here in the future as needed
];

function translate(dockerComposeContent: string, languageAbbreviation: string, templateFormat?: TemplateFormat): any {
  try {
    const dockerCompose = YAML.parse(dockerComposeContent) as DockerCompose;

    // Validation: Check if services exist
    if (!dockerCompose.services || Object.keys(dockerCompose.services).length === 0) {
      throw new DockerComposeValidationError('No services found in docker-compose file');
    }

    // Validation: Check if each service has an image
    for (const [serviceName, service] of Object.entries<DockerComposeService>(dockerCompose.services)) {
      if (!service.image) {
        throw new DockerComposeValidationError(
          `Service '${serviceName}' does not have an image specified. ` +
          'All services must use pre-built images. Build instructions are not supported.'
        );
      }
    }

    const parser = parsers.find(parser => parser.getInfo().languageAbbreviation.toLowerCase() === languageAbbreviation.toLowerCase());
    if (!parser) {
      throw new Error(`Unsupported target language: ${languageAbbreviation}`);
    }

    const translatedConfig = parser.parse(dockerCompose, templateFormat);
    return translatedConfig;
  } catch (e) {
    if (e instanceof DockerComposeValidationError) {
      console.error(`Validation Error: ${e.message}`);
    } else {
      console.error(`Error translating docker-compose content: ${e}`);
    }
    throw e;
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
