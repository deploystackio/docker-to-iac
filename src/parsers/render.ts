import { BaseParser, ParserInfo, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { ApplicationConfig } from '../types/container-config';
import { getImageUrl } from '../utils/getImageUrl';
import { constructImageString } from '../utils/constructImageString';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { parseEnvironmentVariables } from '../utils/parseEnvironmentVariables';
import { getRenderServiceType } from '../utils/getRenderServiceType';

const defaultParserConfig: DefaultParserConfig = {
  subscriptionName: 'starter',
  region: 'oregon',
  fileName: 'render.yaml',
  diskSizeGB: 10,
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

      const environmentVariables = parseEnvironmentVariables(serviceConfig.environment);

      if (ports.size > 0) {
        environmentVariables['PORT'] = Array.from(ports)[0];
      }

      const service: any = {
        name: serviceName,
        type: getRenderServiceType(serviceConfig.image),
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

    const renderConfig = {
      services
    };
    
    return formatResponse(JSON.stringify(renderConfig, null, 2), templateFormat);
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
      provieerNameAbbreviation: 'RND',
      languageOfficialDocs: 'https://docs.render.com/infrastructure-as-code',
      languageAbbreviation: 'RND',
      languageName: 'Render Blue Print',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new RenderParser();
