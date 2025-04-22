import { BaseParser, ParserInfo, TemplateFormat, ParserConfig } from './base-parser';
import { ApplicationConfig, FileOutput } from '../types/container-config';
import { getImageUrl } from '../utils/getImageUrl';
import { constructImageString } from '../utils/constructImageString';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { getRenderServiceType } from '../utils/getRenderServiceType';
import { isRenderDatabaseService } from '../utils/isRenderDatabaseService';

const defaultParserConfig: ParserConfig = {
  files: [
    {
      path: 'render.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: true,
      description: 'Render Blueprint configuration'
    }
  ],
  subscriptionName: 'starter',
  region: 'oregon',
  diskSizeGB: 10
};

class RenderParser extends BaseParser {
  // Legacy method implementation (calls parseFiles under the hood)
  parse(config: ApplicationConfig, templateFormat: TemplateFormat = TemplateFormat.yaml): any {
    return super.parse(config, templateFormat);
  }
  
  // New multi-file implementation
  parseFiles(config: ApplicationConfig): { [path: string]: FileOutput } {
    const services: Array<any> = [];
    const databases: Array<any> = [];
    const keyvalueServices: Array<any> = [];
    const databaseServiceMap = new Map<string, string>();

    // First pass: Identify database services and register them
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      const imageUrl = getImageUrl(constructImageString(serviceConfig.image));
      
      // Check if PostgreSQL - should go into databases section
      if (isRenderDatabaseService(serviceConfig.image) && imageUrl.includes('postgres')) {
        // Create a database instead of a service
        const dbName = this.sanitizeName(`${serviceName}-db`);
        
        // Track the mapping between service name and database name
        databaseServiceMap.set(serviceName, dbName);
        
        databases.push({
          name: dbName,
          plan: 'free', // PostgreSQL free plan - there is no starter for PostgreSQL.
        });
        
        continue;
      }
      
      // Check if Redis - should go into services section as type: redis
      if (isRenderDatabaseService(serviceConfig.image) && imageUrl.includes('redis')) {
        const redisName = this.sanitizeName(serviceName);
        
        // Track the mapping between service name and Redis service name
        databaseServiceMap.set(serviceName, redisName);
        
        keyvalueServices.push({
          type: 'redis',
          name: redisName,
          plan: 'free', // Redis free plan - there is no starter for Redis.
          ipAllowList: [
            {
              source: '0.0.0.0/0',
              description: 'everywhere'
            }
          ]
        });

        continue;
      }

      // Non-database services will be processed in the second pass
    }

    // Second pass: Process regular services with database connections
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      // Skip database services that have already been processed
      if (databaseServiceMap.has(serviceName)) {
        continue;
      }

      const ports = new Set<number>();
      
      if (serviceConfig.ports) {
        serviceConfig.ports.forEach(portMapping => {
          if (typeof portMapping === 'object' && portMapping !== null) {
            ports.add(portMapping.container);
          } else {
            const parsedPort = parsePort(portMapping);
            if (parsedPort) {
              ports.add(parsedPort);
            }
          }
        });
      }

      // Start with base environment variables
      const environmentVariables = { ...serviceConfig.environment };

      if (ports.size > 0) {
        environmentVariables['PORT'] = Array.from(ports)[0].toString();
      }

      // Prepare the basic service definition
      const service: any = {
        name: serviceName,
        type: getRenderServiceType(serviceConfig.image),
        runtime: 'image',
        image: { url: getImageUrl(constructImageString(serviceConfig.image)) },
        startCommand: parseCommand(serviceConfig.command),
        plan: defaultParserConfig.subscriptionName,
        region: defaultParserConfig.region,
        envVars: []
      };

      // Process service connections - this is provider specific logic
      if (config.serviceConnections) {
        // First, add all regular environment variables except those in service connections
        for (const [key, value] of Object.entries(environmentVariables)) {
          // Skip variables that will be handled by service connections
          const isHandledByConnection = config.serviceConnections.some(conn => 
            conn.fromService === serviceName && 
            Object.keys(conn.variables).includes(key)
          );

          if (!isHandledByConnection) {
            service.envVars.push({
              key,
              value: value.toString()
            });
          }
        }

        // Then add service connection variables with proper Render syntax
        for (const connection of config.serviceConnections) {
          if (connection.fromService === serviceName) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [varName, varInfo] of Object.entries(connection.variables)) {
              // Check if the target is a database service
              if (databaseServiceMap.has(connection.toService)) {
                const targetServiceName = databaseServiceMap.get(connection.toService);
                const targetImageUrl = getImageUrl(constructImageString(config.services[connection.toService].image));
                
                // Different handling based on database type
                if (targetImageUrl.includes('postgres')) {
                  // PostgreSQL uses fromDatabase
                  service.envVars.push({
                    key: varName,
                    fromDatabase: {
                      name: targetServiceName, // This is the database name with -db suffix
                      property: connection.property || 'connectionString'
                    }
                  });
                } else if (targetImageUrl.includes('redis')) {
                  // Redis uses fromService with type: redis
                  service.envVars.push({
                    key: varName,
                    fromService: {
                      name: targetServiceName,
                      type: 'redis',
                      property: connection.property || 'connectionString'
                    }
                  });
                }
              } else {
                // Regular service connection
                service.envVars.push({
                  key: varName,
                  fromService: {
                    name: connection.toService,
                    type: getRenderServiceType(config.services[connection.toService].image),
                    property: connection.property || 'hostport'
                  }
                });
              }
            }
          }
        }
      } else {
        // No service connections, just add all environment variables
        service.envVars = Object.entries(environmentVariables).map(([key, value]) => ({
          key,
          value: value.toString()
        }));
      }

      // Add disk configuration if volumes are present
      if (serviceConfig.volumes && serviceConfig.volumes.length > 0) {
        // Take the first volume - Render only supports one disk per service
        const volume = serviceConfig.volumes[0];
        
        service.disk = {
          name: this.generateDiskName(serviceName, volume.container),
          mountPath: volume.container,
          sizeGB: defaultParserConfig.diskSizeGB
        };

        // If there are more volumes, log a warning
        if (serviceConfig.volumes.length > 1) {
          console.warn(`Warning: Service ${serviceName} has multiple volumes. Only the first volume will be configured as a Render disk.`);
        }
      }

      services.push(service);
    }

    const renderConfig: any = {
      services: [...services, ...keyvalueServices]
    };

    // Add databases section if we have any
    if (databases.length > 0) {
      renderConfig.databases = databases;
    }

    // Return object with a single file - convert to string
    return {
      'render.yaml': {
        content: this.formatFileContent(renderConfig, TemplateFormat.yaml),
        format: TemplateFormat.yaml,
        isMain: true
      }
    };
  }

  private sanitizeName(name: string): string {
    // Sanitize the name to match Render's requirements
    return name.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private generateDiskName(serviceName: string, mountPath: string): string {
    // Create a disk name from service name and mount path
    const sanitizedPath = mountPath
      .replace(/^\//, '')
      .replace(/[^a-zA-Z0-9-]/g, '-');
    
    // Combine and truncate to 63 characters (common DNS label length limit)
    let name = `${serviceName}-${sanitizedPath}`.toLowerCase();
    if (name.length > 63) {
      name = name.substring(0, 63);
      name = name.replace(/-+$/, '');
    }
    
    return name;
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://render.com/docs',
      providerName: 'Render',
      providerNameAbbreviation: 'RND',
      languageOfficialDocs: 'https://docs.render.com/infrastructure-as-code',
      languageAbbreviation: 'RND',
      languageName: 'Render Blue Print',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new RenderParser();
