import { DockerImageInfo } from '../parsers/base-parser';

export interface PortMapping {
  host: number;
  container: number;
  protocol?: string;
  // Docker Compose compatibility
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
