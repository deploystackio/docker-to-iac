export type StringPattern = 'uppercase' | 'lowercase' | 'normal';

export type EnvVarGenerationType = {
  type: 'password' | 'string' | 'number';
  length?: number;
  pattern?: StringPattern;
  min?: number;
  max?: number;
};

export type ImageEnvVarConfig = {
  [variableName: string]: EnvVarGenerationType;
};

export type ImageVersionConfig = {
  [version: string]: {
    environment: ImageEnvVarConfig;
  };
};

export type EnvironmentVariableGenerationConfig = {
  [imageName: string]: {
    versions: ImageVersionConfig;
  };
};
