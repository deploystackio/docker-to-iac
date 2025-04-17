import { describe, test, expect, vi, beforeEach } from 'vitest';
import { RunCommandParser } from '../../../../src/sources/run';
import { SourceValidationError } from '../../../../src/sources/base';
import { RegistryType } from '../../../../src/parsers/base-parser';
import * as normalizePortModule from '../../../../src/utils/normalizePort';
import * as normalizeVolumeModule from '../../../../src/utils/normalizeVolume';
import * as normalizeEnvironmentModule from '../../../../src/utils/normalizeEnvironment';
import * as processEnvironmentVariablesGenerationModule from '../../../../src/utils/processEnvironmentVariablesGeneration';
import * as parseDockerImageModule from '../../../../src/utils/parseDockerImage';

describe('RunCommandParser', () => {
  let parser: RunCommandParser;

  beforeEach(() => {
    parser = new RunCommandParser();
    
    // Reset all mocks
    vi.restoreAllMocks();
  });

  describe('validate', () => {
    test('should validate valid docker run command', () => {
      expect(parser.validate('docker run nginx')).toBe(true);
      expect(parser.validate('docker run -p 80:80 nginx')).toBe(true);
      expect(parser.validate('docker run --name webapp nginx')).toBe(true);
    });

    test('should throw error for invalid command', () => {
      expect(() => parser.validate('invalid command'))
        .toThrow(SourceValidationError);
      expect(() => parser.validate('invalid command'))
        .toThrow('Command must start with "docker run"');
    });

    test('should throw error for malformed docker command', () => {
      expect(() => parser.validate('dockerrun'))
        .toThrow(SourceValidationError);
    });
  });

  describe('parse', () => {
    test('should parse simple docker run command', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      const result = parser.parse('docker run nginx');
      
      expect(result.services).toHaveProperty('default');
      expect(result.services.default.image).toEqual({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });
      expect(result.services.default.ports).toEqual([]);
      expect(result.services.default.volumes).toEqual([]);
      expect(result.services.default.environment).toEqual({});
      expect(result.services.default.command).toBe('');
    });

    test('should parse docker run command with port mappings', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      // Mock normalizePort
      vi.spyOn(normalizePortModule, 'normalizePort').mockReturnValue({
        host: 80,
        container: 80
      });

      const result = parser.parse('docker run -p 80:80 nginx');
      
      expect(result.services.default.ports).toEqual([{
        host: 80,
        container: 80
      }]);
      expect(normalizePortModule.normalizePort).toHaveBeenCalledWith('80:80');
    });

    test('should parse docker run command with environment variables', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      // Mock normalizeEnvironment
      vi.spyOn(normalizeEnvironmentModule, 'normalizeEnvironment').mockReturnValue({
        NODE_ENV: 'production'
      });

      const result = parser.parse('docker run -e NODE_ENV=production nginx');
      
      expect(result.services.default.environment).toEqual({
        NODE_ENV: 'production'
      });
      expect(normalizeEnvironmentModule.normalizeEnvironment).toHaveBeenCalledWith('NODE_ENV=production');
    });

    test('should parse docker run command with volumes', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      // Mock normalizeVolume
      vi.spyOn(normalizeVolumeModule, 'normalizeVolume').mockReturnValue({
        host: './html',
        container: '/usr/share/nginx/html',
        mode: 'rw'
      });

      const result = parser.parse('docker run -v ./html:/usr/share/nginx/html nginx');
      
      expect(result.services.default.volumes).toEqual([{
        host: './html',
        container: '/usr/share/nginx/html',
        mode: 'rw'
      }]);
      expect(normalizeVolumeModule.normalizeVolume).toHaveBeenCalledWith('./html:/usr/share/nginx/html');
    });

    test('should parse docker run command with command', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      const result = parser.parse('docker run nginx bash echo hello');
      
      expect(result.services.default.command).toBe('bash echo hello');
    });

    test('should handle quoted arguments correctly', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      // Mock normalizeEnvironment
      vi.spyOn(normalizeEnvironmentModule, 'normalizeEnvironment').mockReturnValue({
        GREETING: 'Hello World'
      });

      const result = parser.parse('docker run -e "GREETING=Hello World" nginx');
      
      expect(normalizeEnvironmentModule.normalizeEnvironment).toHaveBeenCalledWith('GREETING=Hello World');
      expect(result.services.default.environment).toEqual({
        GREETING: 'Hello World'
      });
    });

    test('should process environment variables with environmentOptions', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'mysql',
        tag: 'latest'
      });

      // Mock normalizeEnvironment
      vi.spyOn(normalizeEnvironmentModule, 'normalizeEnvironment').mockReturnValue({
        MYSQL_ROOT_PASSWORD: '${DB_PASSWORD}'
      });

      // Mock processEnvironmentVariablesGeneration
      vi.spyOn(processEnvironmentVariablesGenerationModule, 'processEnvironmentVariablesGeneration')
        .mockReturnValue({
          MYSQL_ROOT_PASSWORD: 'secure_password',
          MYSQL_DATABASE: 'app_db'
        });

      // Create properly typed environment options
      const envOptions = {
        environmentVariables: {
          DB_PASSWORD: 'secure_password'
        },
        environmentGeneration: {
          mysql: {
            versions: {
              latest: {
                environment: {
                  MYSQL_DATABASE: {
                    type: 'string' as const // Use const assertion to ensure exact string literal type
                  }
                }
              }
            }
          }
        },
        getPersistedEnvVars: vi.fn().mockReturnValue({}),
        setPersistedEnvVars: vi.fn()
      };

      const result = parser.parse('docker run -e MYSQL_ROOT_PASSWORD=${DB_PASSWORD} mysql', envOptions);
      
      expect(result.services.default.environment).toEqual({
        MYSQL_ROOT_PASSWORD: 'secure_password',
        MYSQL_DATABASE: 'app_db'
      });
      
      expect(envOptions.setPersistedEnvVars).toHaveBeenCalledWith('default', {
        MYSQL_ROOT_PASSWORD: 'secure_password',
        MYSQL_DATABASE: 'app_db'
      });
    });

    test('should combine command line and persisted environment variables', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'postgres',
        tag: 'latest'
      });

      // Mock normalizeEnvironment
      vi.spyOn(normalizeEnvironmentModule, 'normalizeEnvironment').mockReturnValue({
        POSTGRES_PASSWORD: 'example'
      });

      const envOptions = {
        getPersistedEnvVars: vi.fn().mockReturnValue({
          POSTGRES_USER: 'admin',
          POSTGRES_DB: 'app_db'
        }),
        setPersistedEnvVars: vi.fn()
      };

      const result = parser.parse('docker run -e POSTGRES_PASSWORD=example postgres', envOptions);
      
      // Check that both command line and persisted vars were combined
      expect(result.services.default.environment).toEqual({
        POSTGRES_PASSWORD: 'example',
        POSTGRES_USER: 'admin',
        POSTGRES_DB: 'app_db'
      });
    });

    test('should handle multiple options of the same type', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      // Mock normalizePort
      vi.spyOn(normalizePortModule, 'normalizePort')
        .mockReturnValueOnce({
          host: 80,
          container: 80
        })
        .mockReturnValueOnce({
          host: 443,
          container: 443
        });

      // Mock normalizeEnvironment
      vi.spyOn(normalizeEnvironmentModule, 'normalizeEnvironment')
        .mockReturnValueOnce({
          VAR1: 'value1'
        })
        .mockReturnValueOnce({
          VAR2: 'value2'
        });

      const result = parser.parse('docker run -p 80:80 -p 443:443 -e VAR1=value1 -e VAR2=value2 nginx');
      
      expect(result.services.default.ports).toEqual([
        { host: 80, container: 80 },
        { host: 443, container: 443 }
      ]);
      
      expect(result.services.default.environment).toEqual({
        VAR1: 'value1',
        VAR2: 'value2'
      });
    });

    test('should ignore unsupported options', () => {
      // Mock parseDockerImage
      vi.spyOn(parseDockerImageModule, 'parseDockerImage').mockReturnValue({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });

      const result = parser.parse('docker run --name my-nginx --restart always --network my-net nginx');
      
      // These options are ignored but should not cause errors
      expect(result.services.default.image).toEqual({
        registry_type: RegistryType.DOCKER_HUB,
        repository: 'nginx',
        tag: 'latest'
      });
    });
  });

  describe('utility functions', () => {
    test('splitCommand handles quoted arguments', () => {
      // Access private method via type casting
      const splitCommand = (parser as any).splitCommand.bind(parser);
      
      const result = splitCommand('docker run -e "FOO=BAR BAZ" image');
      
      expect(result).toEqual(['docker', 'run', '-e', 'FOO=BAR BAZ', 'image']);
    });

    test('splitCommand handles single quotes', () => {
      // Access private method via type casting
      const splitCommand = (parser as any).splitCommand.bind(parser);
      
      const result = splitCommand("docker run -e 'FOO=BAR BAZ' image");
      
      expect(result).toEqual(['docker', 'run', '-e', 'FOO=BAR BAZ', 'image']);
    });
  });
});