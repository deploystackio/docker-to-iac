import { BaseParser, ParserInfo, TemplateFormat, ParserConfig, DockerImageInfo } from './base-parser';
import { ApplicationConfig, FileOutput } from '../types/container-config';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { digitalOceanParserServiceName } from '../utils/digitalOceanParserServiceName';
import { normalizeDigitalOceanImageInfo } from '../utils/normalizeDigitalOceanImageInfo';
import { getDigitalOceanDatabaseType } from '../utils/getDigitalOceanDatabaseType';

const defaultParserConfig: ParserConfig = {
  files: [
    {
      path: '.do/deploy.template.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: true,
      description: 'DigitalOcean App Platform deployment template'
    }
  ],
  region: 'nyc',
  subscriptionName: 'basic-xxs'
};

function getRegistryType(dockerImageInfo: DockerImageInfo): string {
  switch (dockerImageInfo.registry_type) {
    case 'GHCR':
      return 'GHCR';
    case 'DOCKER_HUB':
    default:
      return 'DOCKER_HUB';
  }
}

class DigitalOceanParser extends BaseParser {
  parse(config: ApplicationConfig, templateFormat: TemplateFormat = TemplateFormat.yaml): any {
    return super.parse(config, templateFormat);
  }

  parseFiles(config: ApplicationConfig): { [path: string]: FileOutput } {
    const services: Array<any> = [];
    let isFirstService = true;

    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      const dockerImageInfo = serviceConfig.image;
      const databaseConfig = getDigitalOceanDatabaseType(dockerImageInfo);
      const normalizedImage = normalizeDigitalOceanImageInfo(dockerImageInfo);

      const baseService = {
        name: digitalOceanParserServiceName(serviceName),
        image: {
          registry_type: getRegistryType(dockerImageInfo),
          registry: normalizedImage.registry,
          repository: normalizedImage.repository,
          tag: dockerImageInfo.tag || 'latest'
        },
        instance_count: 1,
        instance_size_slug: defaultParserConfig.subscriptionName,
        run_command: parseCommand(serviceConfig.command),
        envs: Object.entries(serviceConfig.environment)
          .map(([key, value]) => ({
            key,
            value: value.toString()
          }))
      };

      if (databaseConfig) {
        // Database/TCP service configuration
        services.push({
          ...baseService,
          health_check: {
            port: databaseConfig.portNumber
          },
          internal_ports: [databaseConfig.portNumber]
        });
      } else {
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

        const routePath = isFirstService ? '/' : `/${serviceName}`;
        isFirstService = false;

        services.push({
          ...baseService,
          http_port: ports.size > 0 ? Array.from(ports)[0] : undefined,
          routes: [{ path: routePath }]
        });
      }
    }

    const digitalOceanConfig = {
      spec: {
        name: 'deploystack',
        region: defaultParserConfig.region,
        services
      }
    };

    return {
      '.do/deploy.template.yaml': {
        content: this.formatFileContent(digitalOceanConfig, TemplateFormat.yaml),
        format: TemplateFormat.yaml,
        isMain: true
      }
    };
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://www.digitalocean.com/',
      providerName: 'DigitalOcean',
      providerNameAbbreviation: 'DO',
      languageOfficialDocs: 'https://docs.digitalocean.com/products/app-platform/',
      languageAbbreviation: 'DOP',
      languageName: 'DigitalOcean App Spec',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new DigitalOceanParser();
