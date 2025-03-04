import * as YAML from 'yaml';
import { ApplicationConfig } from '../types/container-config';

export type FileOutput = {
  content: any;
  format: TemplateFormat;
  isMain?: boolean;
}

export type ParserFileConfig = {
  path: string;
  templateFormat: TemplateFormat;
  isMain?: boolean;
  description?: string;
}

export type ParserConfig = {
  files: ParserFileConfig[];
  cpu?: any;
  memory?: any;
  diskSizeGB?: number;
  region?: string;
  subscriptionName?: string;
}

export type ParserInfo = {
  providerWebsite: string;
  providerName: string;
  providerNameAbbreviation: string;
  languageOfficialDocs: string;
  languageAbbreviation: string;
  languageName: string;
  defaultParserConfig: ParserConfig;
};

export enum RegistryType {
  DOCKER_HUB = 'DOCKER_HUB',
  GHCR = 'GHCR'
}

export interface DockerImageInfo {
  registry_type: RegistryType;
  registry?: string;
  repository: string;
  tag?: string;
  digest?: string;
}

export enum TemplateFormat {
  json = 'json',
  yaml = 'yaml',
  text = 'text'
}

export function formatResponse(response: string, templateFormat: TemplateFormat)  {
  switch (templateFormat) {
    case TemplateFormat.json:
      return JSON.parse(response);
    case TemplateFormat.yaml:
      return YAML.stringify(JSON.parse(response), {sortMapEntries: false});
    default:
      return response;
  }
}

export abstract class BaseParser {
  parse(config: ApplicationConfig, templateFormat?: TemplateFormat): any {
    const files = this.parseFiles(config);
    const mainFile = Object.values(files).find(file => file.isMain);
    
    if (!mainFile) {
      throw new Error('No main file defined in parser output');
    }
    
    return typeof mainFile.content === 'string'
      ? mainFile.content
      : formatResponse(JSON.stringify(mainFile.content, null, 2), templateFormat || mainFile.format);
  }
  
  abstract parseFiles(config: ApplicationConfig): { [path: string]: FileOutput };
  
  abstract getInfo(): ParserInfo;
  
  protected formatFileContent(content: any, format: TemplateFormat): string {
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return formatResponse(JSON.stringify(parsed, null, 2), format);
      } catch {
        return content;
      }
    } else {
      return formatResponse(JSON.stringify(content, null, 2), format);
    }
  }
}
