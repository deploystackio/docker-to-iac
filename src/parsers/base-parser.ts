import * as YAML from 'yaml';

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

export interface DockerComposeService {
  image: string;
  ports?: string[];
  command?: string;
  restart?: string;
  volumes?: string[];
  environment?: { [key: string]: string };
}

export interface DockerCompose {
  services: {
    [key: string]: DockerComposeService;
  };
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
  abstract parse(dockerCompose: DockerCompose, templateFormat?: TemplateFormat): any;
  abstract getInfo(): ParserInfo;
}
