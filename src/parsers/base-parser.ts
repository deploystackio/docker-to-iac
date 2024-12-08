// src/parsers/base-parser.ts

import * as YAML from 'yaml';
import { ApplicationConfig } from '../types/container-config';

export type ParserInfo = {
  providerWebsite: string;
  providerName: string;
  provieerNameAbbreviation: string;
  languageOfficialDocs: string;
  languageAbbreviation: string;
  languageName: string;
  defaultParserConfig: DefaultParserConfig
};

export type DefaultParserConfig = {
  templateFormat: TemplateFormat;
  cpu?: any;
  memory?: any;
  region?: string;
  fileName: string;
  subscriptionName?: string;
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
  abstract parse(config: ApplicationConfig, templateFormat?: TemplateFormat): any;
  abstract getInfo(): ParserInfo;
}
