import { BaseParser, ParserInfo, DockerCompose, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { parseDockerImage } from '../utils/parseDockerImage';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { parseEnvironmentVariables } from '../utils/parseEnvironmentVariables';

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
      const ports = new Set<number>();
      
      if (serviceConfig.ports) {
        serviceConfig.ports.forEach(port => {
          const parsedPort = parsePort(port);
          if (parsedPort) {
            ports.add(parsedPort);
          }
        });
      }

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
        http_port: ports.size > 0 ? Array.from(ports)[0] : undefined,
        instance_count: 1,
        instance_size_slug: defaultParserConfig.subscriptionName,
        run_command: parseCommand(serviceConfig.command),
        envs: Object.entries(parseEnvironmentVariables(serviceConfig.environment))
          .map(([key, value]) => ({
            key,
            value: value.toString()
          })),
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
