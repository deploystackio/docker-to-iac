import { BaseParser, ParserInfo, TemplateFormat, ParserConfig, DockerImageInfo } from './base-parser';
import { ApplicationConfig, FileOutput } from '../types/container-config';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { digitalOceanParserServiceName } from '../utils/digitalOceanParserServiceName';
import { normalizeDigitalOceanImageInfo } from '../utils/normalizeDigitalOceanImageInfo';
import { getDigitalOceanDatabaseType } from '../utils/getDigitalOceanDatabaseType';
import { isDigitalOceanManagedDatabase } from '../utils/isDigitalOceanManagedDatabase';

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
    const databases: Array<any> = [];
    const databaseServiceMap = new Map<string, string>();
    let isFirstService = true;

    // First pass: identify database services that should be managed databases
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      if (isDigitalOceanManagedDatabase(serviceConfig.image)) {
        // Create a database entry
        const dbName = digitalOceanParserServiceName(`${serviceName}-db`);
        
        // Track the mapping between service name and database name
        databaseServiceMap.set(serviceName, dbName);
        
        // Get database config
        const dbConfig = getDigitalOceanDatabaseType(serviceConfig.image);
        
        // Create database config object with proper typing
        const dbEntry: any = {
          name: dbName,
          engine: dbConfig?.engine || 'PG' // Default to PostgreSQL if unknown
        };
        
        databases.push(dbEntry);
        
        // Skip creating a service for this database
        continue;
      }

      const dockerImageInfo = serviceConfig.image;
      const databaseConfig = getDigitalOceanDatabaseType(dockerImageInfo);
      const normalizedImage = normalizeDigitalOceanImageInfo(dockerImageInfo);

      // Prepare base service configuration
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
            value: value.toString(),
            scope: 'RUN_TIME'
          }))
      };

      // Process service connections - this is provider specific logic
      if (config.serviceConnections) {
        for (const connection of config.serviceConnections) {
          if (connection.fromService === serviceName) {
            for (const [varName, varInfo] of Object.entries(connection.variables)) {
              // Find the environment variable index
              const envIndex = baseService.envs.findIndex(env => env.key === varName);
              
              // Check if target service is a managed database
              if (databaseServiceMap.has(connection.toService)) {
                const dbServiceName = databaseServiceMap.get(connection.toService)!;
                const transformedValue = `\${${dbServiceName}.DATABASE_URL}`;

                if (envIndex !== -1) {
                  // Update existing variable
                  baseService.envs[envIndex].value = transformedValue;
                } else {
                  // Add new variable
                  baseService.envs.push({
                    key: varName,
                    value: transformedValue,
                    scope: 'RUN_TIME'
                  });
                }
              } else {
                // Regular service connection - not typically used in DigitalOcean but included for completeness
                const targetServiceName = digitalOceanParserServiceName(connection.toService);
                const transformedValue = `\${${targetServiceName}.PRIVATE_URL}`;
                
                if (envIndex !== -1) {
                  baseService.envs[envIndex].value = transformedValue;
                } else {
                  baseService.envs.push({
                    key: varName,
                    value: transformedValue,
                    scope: 'RUN_TIME'
                  });
                }
              }
            }
          }
        }
      }

      if (databaseConfig && !isDigitalOceanManagedDatabase(dockerImageInfo)) {
        // Non-managed database/TCP service configuration
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

    const digitalOceanConfig: any = {
      spec: {
        name: 'deploystack',
        region: defaultParserConfig.region,
        services
      }
    };

    // Add databases section if we have any
    if (databases.length > 0) {
      digitalOceanConfig.spec.databases = databases;
    }

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
