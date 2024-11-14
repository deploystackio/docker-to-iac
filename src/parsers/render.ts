import { BaseParser, ParserInfo, DockerCompose, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { getImageUrl } from '../utils/getImageUrl';

const defaultParserConfig: DefaultParserConfig = {
  subscriptionName: 'free',
  region: 'oregon',
  fileName: 'render.yaml',
  templateFormat: TemplateFormat.yaml
};


class RenderParser extends BaseParser {

  parse(dockerCompose: DockerCompose, templateFormat: TemplateFormat = defaultParserConfig.templateFormat): any {
    const services: Array<any> = [];

    for (const [serviceName, serviceConfig] of Object.entries(dockerCompose.services)) {
      const ports = new Set<number>();
      serviceConfig.ports?.map((value) => { 
        ports.add(Number(value.split(':')[0]));
      });

      const environmentVariables: { [key: string]: string | number } = {};
      if (serviceConfig.environment) {
        Object.entries(serviceConfig.environment).forEach(([key, value]) => {
          if (value.includes('=')) {
            const [splitKey, splitValue] = value.split('=');
            environmentVariables[splitKey] = splitValue;
          } else {
            environmentVariables[key] = value;
          }
        });
      };

      if (ports.size > 0) {
        environmentVariables['PORT'] = Array.from(ports)[0];  // Binding port 
      }

      // Handle different possible types for command
      const startCommand = Array.isArray(serviceConfig.command)
        ? serviceConfig.command.join(' ')
        : serviceConfig.command || '';

      const service: any = {
        name: serviceName,
        type: 'web',
        env: 'docker',
        runtime: 'image',
        image: { url: getImageUrl(serviceConfig.image) },
        startCommand,
        plan: defaultParserConfig.subscriptionName,
        region: defaultParserConfig.region,
        envVars: Object.entries(environmentVariables).map(([key, value]) => ({
          key,
          value
        })),
      };

      services.push(service);
    }

    const renderConfig = {
      services,
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
