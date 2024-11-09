import * as YAML from 'yaml';
import cloudFormationParserInstance from './parsers/aws-cloudformation';
import renderParserInstance from './parsers/render';
import digitalOceanParserInstance from './parsers/digitalocean';
import { BaseParser, ParserInfo, TemplateFormat, DockerCompose, DockerComposeService, DockerComposeValidationError } from './parsers/base-parser';

import { validateDockerCompose } from './utils/validateDockerCompose';

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
    validateDockerCompose(dockerCompose);

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

function listServices(dockerComposeContent: string): { [key: string]: DockerComposeService } {
  try {
    const dockerCompose = YAML.parse(dockerComposeContent) as DockerCompose;
    validateDockerCompose(dockerCompose);

    const normalizedServices: { [key: string]: DockerComposeService } = {};
    
    for (const [serviceName, service] of Object.entries<DockerComposeService>(dockerCompose.services)) {
      // Normalize environment variables to a consistent object format
      let normalizedEnv: { [key: string]: string } = {};
      
      if (service.environment) {
        if (Array.isArray(service.environment)) {
          // Handle array format (["KEY=value", "OTHER_KEY=othervalue"])
          service.environment.forEach(env => {
            const [key, value] = env.split('=');
            normalizedEnv[key] = value || '';
          });
        } else {
          // Handle object format ({ KEY: "value", OTHER_KEY: "othervalue" })
          normalizedEnv = service.environment;
        }
      }

      normalizedServices[serviceName] = {
        image: service.image,
        ports: service.ports || [],
        command: service.command || '',
        restart: service.restart || '',
        volumes: service.volumes || [],
        environment: normalizedEnv
      };
    }

    return normalizedServices;
  } catch (e) {
    if (e instanceof DockerComposeValidationError) {
      console.error(`Validation Error: ${e.message}`);
    } else {
      console.error(`Error parsing docker-compose content: ${e}`);
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


export { 
  translate, 
  getParserInfo, 
  listAllParsers,
  listServices,
};
