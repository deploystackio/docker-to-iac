import { BaseParser, ParserInfo, DockerCompose, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { parseDockerImage } from '../utils/parseDockerImage';

const defaultParserConfig: DefaultParserConfig = {
  templateFormat: TemplateFormat.yaml,
  fileName: '.do/deploy.template.yaml',
  region: 'nyc',
  subscriptionName: 'basic-xxs'
};

class DigitalOceanParser extends BaseParser {
  parse(dockerCompose: DockerCompose, templateFormat: TemplateFormat = defaultParserConfig.templateFormat): any {
    const services: Array<any> = [];
    let isFirstService = true;

    for (const [serviceName, serviceConfig] of Object.entries(dockerCompose.services)) {

      const environmentVariables = [];

      if (serviceConfig.environment) {
        if (Array.isArray(serviceConfig.environment)) {
          for (const env of serviceConfig.environment) {
            const [key, value] = env.split('=');
            environmentVariables.push({
              key: key.trim(),
              value: value ? value.trim() : ''
            });
          }
        } else {
          for (const [key, value] of Object.entries(serviceConfig.environment)) {
            environmentVariables.push({
              key,
              value: value?.toString() || ''
            });
          }
        }
      }
      
      const httpPort = serviceConfig.ports?.length ? parseInt(serviceConfig.ports[0].split(':')[0]) : undefined;
      const dockerImageInfo = parseDockerImage(serviceConfig.image);

      const routePath = isFirstService ? '/' : `/${serviceName}`;
      isFirstService = false;

      const service = {
        name: serviceName,
        image: {
          registry_type: 'DOCKER_HUB',
          repository: dockerImageInfo.repository,
          tag: dockerImageInfo.tag
        },
        http_port: httpPort,
        instance_count: 1,
        instance_size_slug: defaultParserConfig.subscriptionName,
        run_command: Array.isArray(serviceConfig.command)
          ? serviceConfig.command.join(' ')
          : serviceConfig.command || '',
        envs: environmentVariables,
        routes: [{ path: routePath }]
      };

      services.push(service);
    }

    const digitalOceanConfig = {
      spec: {
        name: 'deploystack',
        region: defaultParserConfig.region,
        services: services.map(service => ({
          name: service.name,
          image: service.image,
          http_port: service.http_port,
          instance_count: service.instance_count,
          instance_size_slug: service.instance_size_slug,
          run_command: service.run_command,
          envs: service.envs,
          routes: service.routes
        }))
      }
    };

    return formatResponse(JSON.stringify(digitalOceanConfig, null, 2), templateFormat);
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://www.digitalocean.com/',
      providerName: 'DigitalOcean',
      provieerNameAbbreviation: 'DO',
      languageOfficialDocs: 'https://docs.digitalocean.com/products/app-platform/',
      languageAbbreviation: 'DOP',
      languageName: 'DigitalOcean App Spec',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new DigitalOceanParser();
