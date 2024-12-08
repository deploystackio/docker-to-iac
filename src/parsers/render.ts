import { BaseParser, ParserInfo, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { ApplicationConfig } from '../types/container-config';
import { getImageUrl } from '../utils/getImageUrl';
import { constructImageString } from '../utils/constructImageString';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { parseEnvironmentVariables } from '../utils/parseEnvironmentVariables';

const defaultParserConfig: DefaultParserConfig = {
  subscriptionName: 'free',
  region: 'oregon',
  fileName: 'render.yaml',
  templateFormat: TemplateFormat.yaml
};

class RenderParser extends BaseParser {
  parse(config: ApplicationConfig, templateFormat: TemplateFormat = defaultParserConfig.templateFormat): any {
    const services: Array<any> = [];

    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      const ports = new Set<number>();
      
      if (serviceConfig.ports) {
        serviceConfig.ports.forEach(portMapping => {
          const parsedPort = parsePort(`${portMapping.host}:${portMapping.container}`);
          if (parsedPort) {
            ports.add(parsedPort);
          }
        });
      }

      // Use our environment variables parser
      const environmentVariables = parseEnvironmentVariables(serviceConfig.environment);

      // Add the first available port as the PORT environment variable
      if (ports.size > 0) {
        environmentVariables['PORT'] = Array.from(ports)[0];
      }

      const service: any = {
        name: serviceName,
        type: 'web',
        env: 'docker',
        runtime: 'image',
        image: { url: getImageUrl(constructImageString(serviceConfig.image)) },
        startCommand: parseCommand(serviceConfig.command),
        plan: defaultParserConfig.subscriptionName,
        region: defaultParserConfig.region,
        envVars: Object.entries(environmentVariables).map(([key, value]) => ({
          key,
          value: value.toString()
        }))
      };

      services.push(service);
    }

    const renderConfig = {
      services
    };
    
    return formatResponse(JSON.stringify(renderConfig, null, 2), templateFormat);
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://render.com/docs',
      providerName: 'Render',
      provieerNameAbbreviation: 'RND',
      languageOfficialDocs: 'https://docs.render.com/infrastructure-as-code',
      languageAbbreviation: 'RND',
      languageName: 'Render Blue Print',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new RenderParser();
