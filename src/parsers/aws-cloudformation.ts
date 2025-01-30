import { BaseParser, ParserInfo, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { ApplicationConfig } from '../types/container-config';
import { getImageUrl } from '../utils/getImageUrl';
import { constructImageString } from '../utils/constructImageString';
import { parsePort } from '../utils/parsePort';
import { parseCommand } from '../utils/parseCommand';
import { parseEnvironmentVariables } from '../utils/parseEnvironmentVariables';

const defaultParserConfig: DefaultParserConfig = {
  cpu: 512,
  memory: '1GB',
  templateFormat: TemplateFormat.yaml,
  fileName: 'aws-cloudformation.cf.yml'
};

class CloudFormationParser extends BaseParser {
  replaceSpecialDirectives(input: string): string {
    const refRegex = /"!Ref ([^"]+)"/g;
    const joinRegex = /"!Join (\[.*?\])"/g;
  
    let output = input.replace(refRegex, '!Ref $1');
    output = output.replace(joinRegex, '!Join $1');
  
    return output;
  }

  parse(config: ApplicationConfig, templateFormat: TemplateFormat = defaultParserConfig.templateFormat): any {
    let response: any = {};
    const parameters: any = {};
    const resources: any = {};

    // Mandatory Template Values
    parameters['VPC'] = { Type: 'AWS::EC2::VPC::Id' };
    parameters['SubnetA'] = { Type: 'AWS::EC2::Subnet::Id' };
    parameters['SubnetB'] = { Type: 'AWS::EC2::Subnet::Id' };
    parameters['ServiceName'] = { 
      Type: 'String',
      Default: 'DeployStackService'
    };
    
    // Base AWS Resources
    resources['Cluster'] = {
      Type: 'AWS::ECS::Cluster',
      Properties: { ClusterName: '!Join [\'\', [!Ref ServiceName, Cluster]]' }
    };

    resources['ExecutionRole'] = {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: '!Join [\'\', [!Ref ServiceName, ExecutionRole]]',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Action: 'sts:AssumeRole'
            }
          ]
        },
        ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        ]
      }
    };

    // Process each service in the docker compose
    for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
      resources[`LogGroup${serviceName}`] = {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
          LogGroupName: `!Join ['', [/ecs/, !Ref ServiceName, TaskDefinition${serviceName}]]`
        }
      };

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

      const environmentVariables = parseEnvironmentVariables(serviceConfig.environment);
      const commandString = parseCommand(serviceConfig.command);
      const commandArray = commandString && commandString.trim() ? commandString.trim().split(' ') : undefined;

      const containerDefinition: any = {
        Name: serviceName,
        Image: getImageUrl(constructImageString(serviceConfig.image)),
        ReadonlyRootFilesystem: false,
        PortMappings: Array.from(ports).map(port => ({
          ContainerPort: port
        })),
        Environment: Object.entries(environmentVariables).map(([key, value]) => ({
          name: key,
          value: value.toString()
        })),
        LogConfiguration: {
          LogDriver: 'awslogs',
          Options: {
            'awslogs-region': '!Ref AWS::Region',
            'awslogs-group': `!Ref LogGroup${serviceName}`,
            'awslogs-stream-prefix': 'ecs'
          }
        }
      };      
      
      if (commandArray && commandArray.length > 0 && commandArray[0] !== '') {
        containerDefinition.Command = commandArray;
      }   

      resources[`TaskDefinition${serviceName}`] = {
        Type: 'AWS::ECS::TaskDefinition',
        DependsOn: [
          `LogGroup${serviceName}`
        ],
        Properties: {
          Family: `!Join ['', [!Ref ServiceName, TaskDefinition${serviceName}]]`,
          NetworkMode: 'awsvpc',
          RequiresCompatibilities: ['FARGATE'],
          Cpu: defaultParserConfig.cpu,
          Memory: defaultParserConfig.memory,
          ExecutionRoleArn: '!Ref ExecutionRole',
          ContainerDefinitions: [containerDefinition]
        }
      };

      resources[`ContainerSecurityGroup${serviceName}`] = {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          GroupDescription: `!Join ['', [${serviceName}, ContainerSecurityGroup]]`,
          VpcId: '!Ref VPC',
          SecurityGroupIngress: {
            IpProtocol: 'tcp',
            FromPort: 0,
            ToPort: 65535,
            CidrIp: '0.0.0.0/0'
          }
        }
      };

      resources[`Service${serviceName}`] = {
        Type: 'AWS::ECS::Service',
        Properties: {
          ServiceName: serviceName,
          Cluster: '!Ref Cluster',
          TaskDefinition: `!Ref TaskDefinition${serviceName}`,
          DesiredCount: 1,
          LaunchType: 'FARGATE',
          NetworkConfiguration: {
            AwsvpcConfiguration: {
              AssignPublicIp: 'ENABLED',
              Subnets: [
                '!Ref SubnetA',
                '!Ref SubnetB'
              ],
              SecurityGroups: [`!Ref ContainerSecurityGroup${serviceName}`]
            }
          }
        }
      };
    }

    response = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'DeployStack CFN template translated from Docker compose',
      Parameters: parameters,
      Resources: resources
    };

    switch (templateFormat) {
      case TemplateFormat.yaml:
        return this.replaceSpecialDirectives(formatResponse(JSON.stringify(response, null, 2), templateFormat));
      default:
        return formatResponse(JSON.stringify(response, null, 2), templateFormat);
    }
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://aws.amazon.com/cloudformation/',
      providerName: 'Amazon Web Services',
      providerNameAbbreviation: 'AWS',      
      languageOfficialDocs: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html',
      languageAbbreviation: 'CFN',
      languageName: 'AWS CloudFormation',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new CloudFormationParser();
