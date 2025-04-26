import { BaseParser, ParserInfo, TemplateFormat, ParserConfig } from './base-parser';
import { ApplicationConfig, FileOutput } from '../types/container-config';
import { getImageUrl } from '../utils/getImageUrl';
import { constructImageString } from '../utils/constructImageString';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { isHelmDatabaseImage, processHelmDatabaseConfig, detectHelmDatabaseConnections } from '../utils/helmDatabaseConnections';

const defaultParserConfig: ParserConfig = {
  files: [
    {
      path: 'Chart.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: true,
      description: 'Helm Chart definition file'
    },
    {
      path: 'values.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: false,
      description: 'Helm Chart values configuration'
    },
    {
      path: 'templates/deployment.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: false,
      description: 'Kubernetes Deployment template'
    },
    {
      path: 'templates/service.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: false,
      description: 'Kubernetes Service template'
    },
    {
      path: 'templates/configmap.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: false,
      description: 'Kubernetes ConfigMap template for environment variables'
    },
    {
      path: 'templates/secret.yaml',
      templateFormat: TemplateFormat.yaml,
      isMain: false,
      description: 'Kubernetes Secret template for sensitive data'
    }
  ],
  cpu: '100m',
  memory: '128Mi'
};

class HelmParser extends BaseParser {
  parse(config: ApplicationConfig, templateFormat: TemplateFormat = TemplateFormat.yaml): any {
    return super.parse(config, templateFormat);
  }

  parseFiles(config: ApplicationConfig): { [path: string]: FileOutput } {
    const files: { [path: string]: FileOutput } = {};
    
    // Auto-detect database connections if not already provided
    if (!config.serviceConnections) {
      const detectedConnections = detectHelmDatabaseConnections(config);
      if (detectedConnections.length > 0) {
        // Transform the detected connections into ResolvedServiceConnection objects
        config.serviceConnections = detectedConnections.map(conn => ({
          fromService: conn.fromService,
          toService: conn.toService,
          property: 'hostport', // Default property
          variables: conn.environmentVariables.reduce((obj, varName) => {
            obj[varName] = {
              originalValue: config.services[conn.fromService].environment[varName],
              transformedValue: config.services[conn.fromService].environment[varName]
            };
            return obj;
          }, {} as Record<string, { originalValue: string; transformedValue: string }>)
        }));
      }
    }
    
    // Process Chart.yaml - the main chart definition with dependencies
    const chartYaml = this.generateChartYaml(config);
    files['Chart.yaml'] = {
      content: this.formatFileContent(chartYaml, TemplateFormat.yaml),
      format: TemplateFormat.yaml,
      isMain: true
    };

    // Process values.yaml
    const valuesYaml = this.generateValuesYaml(config);
    files['values.yaml'] = {
      content: this.formatFileContent(valuesYaml, TemplateFormat.yaml),
      format: TemplateFormat.yaml,
      isMain: false
    };

    // Process template files
    files['templates/deployment.yaml'] = {
      content: this.formatFileContent(this.generateDeploymentTemplate(), TemplateFormat.yaml),
      format: TemplateFormat.yaml,
      isMain: false
    };

    files['templates/service.yaml'] = {
      content: this.formatFileContent(this.generateServiceTemplate(), TemplateFormat.yaml),
      format: TemplateFormat.yaml,
      isMain: false
    };

    files['templates/configmap.yaml'] = {
      content: this.formatFileContent(this.generateConfigMapTemplate(), TemplateFormat.yaml),
      format: TemplateFormat.yaml,
      isMain: false
    };

    files['templates/secret.yaml'] = {
      content: this.formatFileContent(this.generateSecretTemplate(), TemplateFormat.yaml),
      format: TemplateFormat.yaml,
      isMain: false
    };

    // Add NOTES.txt file
    files['templates/NOTES.txt'] = {
      content: this.generateNotesTemplate(),
      format: TemplateFormat.text,
      isMain: false
    };

    // Add _helpers.tpl file
    files['templates/_helpers.tpl'] = {
      content: this.generateHelpersTemplate(),
      format: TemplateFormat.text,
      isMain: false
    };

    return files;
  }

  private generateChartYaml(config?: ApplicationConfig): any {
    const chart = {
      apiVersion: 'v2',
      name: 'deploystack-app',
      description: 'A Helm chart for DeployStack application generated from Docker configuration',
      type: 'application',
      version: '0.1.0',
      appVersion: '1.0.0',
      maintainers: [
        {
          name: 'DeployStack',
          email: 'hello@deploystack.io'
        }
      ],
      dependencies: [] as any[]
    };
    
    // Add dependencies for database services if config is provided
    if (config) {
      for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
        if (isHelmDatabaseImage(serviceConfig.image)) {
          // Get database config from our util
          const dbConfig = processHelmDatabaseConfig(serviceName, serviceConfig);
          
          if (dbConfig) {
            chart.dependencies.push({
              name: serviceName,
              repository: dbConfig.repository || 'https://charts.bitnami.com/bitnami',
              version: dbConfig.version || '^1.0.0',
              condition: `dependencies.${serviceName}.enabled`
            });
          }
        }
      }
    }
    
    // Remove empty dependencies array if no dependencies
    if (chart.dependencies.length === 0) {
      chart.dependencies = [];
    }
    
    return chart;
  }

  private generateValuesYaml(config: ApplicationConfig): any {
    const values: any = {
      global: {
        nameOverride: '',
        fullnameOverride: '',
        imagePullSecrets: [],
        podAnnotations: {},
        podSecurityContext: {},
        securityContext: {}
      },
      services: {},
      dependencies: {}
    };

    // Track database services that should be managed with dependency charts
    const managedDatabases = new Map<string, any>();

    // First pass: identify database services that should use Helm charts
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      if (isHelmDatabaseImage(serviceConfig.image)) {
        // Process database config using our utility
        const dbValues = processHelmDatabaseConfig(serviceName, serviceConfig);
        
        if (dbValues) {
          // Register this as a managed database
          managedDatabases.set(serviceName, dbValues);
          
          // Add the dependency to values
          values.dependencies[serviceName] = {
            enabled: true,
            ...dbValues
          };
          
          // Skip this service in the regular services loop
          continue;
        }
      }
    }
    
    // Process each service in the docker compose
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      // Skip managed databases
      if (managedDatabases.has(serviceName)) {
        continue;
      }
      
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

      // Generate values for this service
      values.services[serviceName] = {
        enabled: true,
        replicaCount: 1,
        image: {
          repository: getImageUrl(constructImageString(serviceConfig.image)),
          pullPolicy: 'IfNotPresent',
          tag: serviceConfig.image.tag || 'latest'
        },
        command: parseCommand(serviceConfig.command)?.split(' ') || [],
        service: {
          type: 'ClusterIP',
          ports: Array.from(ports).map(port => ({
            port: port,
            targetPort: port,
            protocol: 'TCP'
          }))
        },
        environment: this.categorizeEnvironmentVariables(serviceConfig.environment),
        resources: {
          limits: {
            cpu: '500m',
            memory: '512Mi'
          },
          requests: {
            cpu: defaultParserConfig.cpu,
            memory: defaultParserConfig.memory
          }
        },
        autoscaling: {
          enabled: false,
          minReplicas: 1,
          maxReplicas: 10,
          targetCPUUtilizationPercentage: 80
        },
        volumes: serviceConfig.volumes.map(volume => ({
          name: this.sanitizeKubernetesName(`${serviceName}-${volume.container.replace(/\//g, '-')}`),
          mountPath: volume.container,
          hostPath: volume.host
        }))
      };

      // Process service connections if provided
      if (config.serviceConnections) {
        values.services[serviceName].dependencies = [];
        
        for (const connection of config.serviceConnections) {
          if (connection.fromService === serviceName) {
            // Check if the target is a managed database
            const targetService = connection.toService;
            const isTargetManagedDb = managedDatabases.has(targetService);
            
            values.services[serviceName].dependencies.push({
              service: targetService,
              variables: connection.variables,
              isDatabaseDependency: isTargetManagedDb
            });
          }
        }
      }
    }

    return values;
  }

  /**
   * Categorizes environment variables into regular and sensitive
   * This allows Helm to separate them into ConfigMaps and Secrets
   */
  private categorizeEnvironmentVariables(environment: Record<string, string>): {
    regular: Record<string, string>;
    sensitive: Record<string, string>;
  } {
    const sensitive: Record<string, string> = {};
    const regular: Record<string, string> = {};

    const sensitiveKeywords = ['password', 'secret', 'key', 'token', 'auth'];

    for (const [key, value] of Object.entries(environment)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeywords.some(keyword => lowerKey.includes(keyword));

      if (isSensitive) {
        sensitive[key] = value;
      } else {
        regular[key] = value;
      }
    }

    return { regular, sensitive };
  }

  /**
   * Sanitizes a string to be used as a Kubernetes resource name
   */
  private sanitizeKubernetesName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 63);
  }

  /**
   * Generates the Kubernetes Deployment template for Helm
   */
  private generateDeploymentTemplate(): string {
    return `
{{- range $key, $service := .Values.services }}
{{- if $service.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "deploystack.fullname" $ }}-{{ $key }}
  labels:
    {{- include "deploystack.labels" $ | nindent 4 }}
    app.kubernetes.io/component: {{ $key }}
spec:
  {{- if not $service.autoscaling.enabled }}
  replicas: {{ $service.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "deploystack.selectorLabels" $ | nindent 6 }}
      app.kubernetes.io/component: {{ $key }}
  template:
    metadata:
      {{- with $.Values.global.podAnnotations }}
      annotations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      labels:
        {{- include "deploystack.selectorLabels" $ | nindent 8 }}
        app.kubernetes.io/component: {{ $key }}
    spec:
      {{- with $.Values.global.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        {{- toYaml $.Values.global.podSecurityContext | nindent 8 }}
      containers:
        - name: {{ $key }}
          securityContext:
            {{- toYaml $.Values.global.securityContext | nindent 12 }}
          image: "{{ $service.image.repository }}:{{ $service.image.tag | default "latest" }}"
          imagePullPolicy: {{ $service.image.pullPolicy }}
          {{- if $service.command }}
          command:
            {{- toYaml $service.command | nindent 12 }}
          {{- end }}
          ports:
            {{- range $service.service.ports }}
            - name: http-{{ .port }}
              containerPort: {{ .targetPort }}
              protocol: {{ .protocol }}
            {{- end }}
          {{- if or $service.environment.regular $service.environment.sensitive }}
          env:
            {{- range $envKey, $envValue := $service.environment.regular }}
            - name: {{ $envKey }}
              valueFrom:
                configMapKeyRef:
                  name: {{ include "deploystack.fullname" $ }}-{{ $key }}-config
                  key: {{ $envKey }}
            {{- end }}
            {{- range $envKey, $envValue := $service.environment.sensitive }}
            - name: {{ $envKey }}
              valueFrom:
                secretKeyRef:
                  name: {{ include "deploystack.fullname" $ }}-{{ $key }}-secret
                  key: {{ $envKey }}
            {{- end }}
            {{- if $service.dependencies }}
            {{- range $service.dependencies }}
            {{- range $envKey, $envValue := .variables }}
            - name: {{ $envKey }}
              valueFrom:
                configMapKeyRef:
                  name: {{ include "deploystack.fullname" $ }}-{{ $key }}-dependencies
                  key: {{ $envKey }}
            {{- end }}
            {{- end }}
            {{- end }}
          {{- end }}
          {{- with $service.volumes }}
          volumeMounts:
            {{- toYaml . | nindent 12 }}
          {{- end }}
          resources:
            {{- toYaml $service.resources | nindent 12 }}
      {{- with $service.volumes }}
      volumes:
        {{- range . }}
        - name: {{ .name }}
          hostPath:
            path: {{ .hostPath }}
        {{- end }}
      {{- end }}
{{- end }}
{{- end }}
`;
  }
  

  /**
   * Generates the Kubernetes Service template for Helm
   */
  private generateServiceTemplate(): string {
    return `
{{- range $key, $service := .Values.services }}
{{- if $service.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "deploystack.fullname" $ }}-{{ $key }}
  labels:
    {{- include "deploystack.labels" $ | nindent 4 }}
    app.kubernetes.io/component: {{ $key }}
spec:
  type: {{ $service.service.type }}
  ports:
    {{- range $service.service.ports }}
    - port: {{ .port }}
      targetPort: {{ .targetPort }}
      protocol: {{ .protocol }}
      name: http-{{ .port }}
    {{- end }}
  selector:
    {{- include "deploystack.selectorLabels" $ | nindent 4 }}
    app.kubernetes.io/component: {{ $key }}
{{- end }}
{{- end }}
`;
  }

  /**
   * Generates the Kubernetes ConfigMap template for Helm
   */
  private generateConfigMapTemplate(): string {
    return `
{{- range $key, $service := .Values.services }}
{{- if $service.enabled }}
{{- if $service.environment.regular }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "deploystack.fullname" $ }}-{{ $key }}-config
  labels:
    {{- include "deploystack.labels" $ | nindent 4 }}
    app.kubernetes.io/component: {{ $key }}
data:
  {{- toYaml $service.environment.regular | nindent 2 }}
{{- end }}

{{- if $service.dependencies }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "deploystack.fullname" $ }}-{{ $key }}-dependencies
  labels:
    {{- include "deploystack.labels" $ | nindent 4 }}
    app.kubernetes.io/component: {{ $key }}
data:
  {{- range $service.dependencies }}
  {{- $serviceName := .service }}
  {{- range $envKey, $envValue := .variables }}
  {{ $envKey }}: {{ include "deploystack.serviceReference" (dict "service" (index $.Values.services $serviceName) "serviceKey" $serviceName) }}
  {{- end }}
  {{- end }}
{{- end }}
{{- end }}
{{- end }}
`;
  }

  /**
   * Generates the Kubernetes Secret template for Helm
   */
  private generateSecretTemplate(): string {
    return `
{{- range $key, $service := .Values.services }}
{{- if $service.enabled }}
{{- if $service.environment.sensitive }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "deploystack.fullname" $ }}-{{ $key }}-secret
  labels:
    {{- include "deploystack.labels" $ | nindent 4 }}
    app.kubernetes.io/component: {{ $key }}
type: Opaque
data:
  {{- range $envKey, $envValue := $service.environment.sensitive }}
  {{ $envKey }}: {{ $envValue | b64enc | quote }}
  {{- end }}
{{- end }}
{{- end }}
{{- end }}
`;
  }

  /**
   * Generates the NOTES.txt template for Helm
   */
  private generateNotesTemplate(): string {
    return `
Thank you for installing {{ .Chart.Name }}.

Your application has been deployed successfully!

{{- range $key, $service := .Values.services }}
{{- if and $service.enabled $service.service.ports }}

Service {{ $key }}:
{{- if contains "NodePort" $service.service.type }}
  Access on: http://NODE_IP:NODE_PORT
  Get the NodePort by running: kubectl get svc {{ include "deploystack.fullname" $ }}-{{ $key }}
{{- else if contains "LoadBalancer" $service.service.type }}
  Access on: http://EXTERNAL_IP:PORT
  Get the LoadBalancer IP by running: kubectl get svc {{ include "deploystack.fullname" $ }}-{{ $key }}
{{- else if contains "ClusterIP" $service.service.type }}
  Access within the cluster only
  Forward ports by running: kubectl port-forward svc/{{ include "deploystack.fullname" $ }}-{{ $key }} LOCAL_PORT:SERVICE_PORT
{{- end }}
{{- end }}
{{- end }}

For more information on managing your application, see the Helm documentation:
https://helm.sh/docs/
`;
  }

  /**
   * Generates the _helpers.tpl template for Helm
   */
  private generateHelpersTemplate(): string {
    return `
{{/*
Expand the name of the chart.
*/}}
{{- define "deploystack.name" -}}
{{- default .Chart.Name .Values.global.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "deploystack.fullname" -}}
{{- if .Values.global.fullnameOverride }}
{{- .Values.global.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.global.nameOverride }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "deploystack.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "deploystack.labels" -}}
helm.sh/chart: {{ include "deploystack.chart" . }}
{{ include "deploystack.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "deploystack.selectorLabels" -}}
app.kubernetes.io/name: {{ include "deploystack.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Service reference helper
*/}}
{{- define "deploystack.serviceReference" -}}
{{- if .service }}
{{- if .service.service.ports }}
{{- with index .service.service.ports 0 }}
{{ $.serviceKey }}.{{ $.serviceName }}.svc.cluster.local:{{ .port }}
{{- end }}
{{- else }}
{{ $.serviceKey }}.{{ $.serviceName }}.svc.cluster.local
{{- end }}
{{- else }}
unknown-service-reference
{{- end }}
{{- end }}
`;
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://helm.sh/',
      providerName: 'Kubernetes',
      providerNameAbbreviation: 'K8S',
      languageOfficialDocs: 'https://helm.sh/docs/',
      languageAbbreviation: 'HELM',
      languageName: 'Helm Chart',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new HelmParser();
