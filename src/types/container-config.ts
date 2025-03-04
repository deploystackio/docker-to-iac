import { DockerImageInfo, TemplateFormat } from '../parsers/base-parser';
import { EnvironmentVariableGenerationConfig } from './environment-config';

export interface PortMapping {
  host: number;
  container: number;
  protocol?: string;
  published?: number;
  target?: number;
}

export interface VolumeMapping {
  host: string;
  container: string;
  mode?: string;
}

export interface ContainerConfig {
  image: DockerImageInfo;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  environment: { [key: string]: string };
  command?: string;
  restart?: string;
}

export interface ApplicationConfig {
  services: {
    [key: string]: ContainerConfig;
  };
}

export interface FileOutput {
  content: string;
  format: TemplateFormat;
  isMain?: boolean;
}

export interface TranslationResult {
  files: { [path: string]: FileOutput };
}

export type TranslateOptions = {
  source: 'compose' | 'run';
  target: string;
  templateFormat?: TemplateFormat;
  environmentVariableGeneration?: EnvironmentVariableGenerationConfig;
  environmentVariables?: Record<string, string>;
  persistenceKey?: string;
};

export type ListServicesOptions = {
  source: 'compose' | 'run';
  environmentVariableGeneration?: EnvironmentVariableGenerationConfig;
  environmentVariables?: Record<string, string>;
  persistenceKey?: string;
};
