import { BaseParser, ParserInfo, TemplateFormat, formatResponse, DefaultParserConfig, DockerImageInfo } from './base-parser';
import { ApplicationConfig } from '../types/container-config';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { digitalOceanParserServiceName } from '../utils/digitalOceanParserServiceName';
import { parseEnvironmentVariables } from '../utils/parseEnvironmentVariables';
import { constructImageString } from '../utils/constructImageString';

const defaultParserConfig: DefaultParserConfig = {
  templateFormat: TemplateFormat.yaml,
  fileName: '.do/deploy.template.yaml',
  region: 'nyc',
  subscriptionName: 'basic-xxs'
};

/**
 * Gets the registry type for DigitalOcean format based on Docker image info
 */
function getRegistryType(dockerImageInfo: DockerImageInfo): string {
  switch (dockerImageInfo.registry_type) {
    case 'GHCR':
      return 'GITHUB';
    case 'DOCKER_HUB':
    default:
      return 'DOCKER_HUB';
  }
}

class DigitalOceanParser extends BaseParser {
  parse(config: ApplicationConfig, templateFormat: TemplateFormat = defaultParserConfig.templateFormat): any {
    const services: Array<any> = [];
    let isFirstService = true;

    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      const ports = new Set<number>();
      
      if (serviceConfig.ports) {
        serviceConfig.ports.forEach(port => {
          if (typeof port === 'object' && port !== null) {
            ports.add(port.container);
          } else {
            const parsedPort = parsePort(port);
            if (parsedPort) {
              ports.add(parsedPort);
            }
          }
        });
      }

      // Use the image info directly since it's already a DockerImageInfo object
      const dockerImageInfo = serviceConfig.image;
      const imageString = constructImageString(dockerImageInfo);
      const [repository, tag] = imageString.split(':');

      const routePath = isFirstService ? '/' : `/${serviceName}`;
      isFirstService = false;

      const service = {
        name: digitalOceanParserServiceName(serviceName),
        image: {
          registry_type: getRegistryType(dockerImageInfo),
          repository: repository,
          tag: tag || 'latest'
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
