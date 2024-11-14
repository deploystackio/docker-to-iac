import { BaseParser, ParserInfo, DockerCompose, TemplateFormat, formatResponse, DefaultParserConfig } from './base-parser';
import { getImageUrl } from '../utils/getImageUrl';

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

  parse(dockerCompose: DockerCompose, templateFormat: TemplateFormat = defaultParserConfig.templateFormat): any {

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
    resources['TaskRole'] = {
      Type: 'AWS::IAM::Role',
      Properties: {
        RoleName: '!Join [\'\', [!Ref ServiceName, TaskRole]]',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Action: 'sts:AssumeRole',              
            }
          ]
        }
      }
    };

    // Populate resources based on dockerCompose contents
    for (const [serviceName, serviceConfig] of Object.entries(dockerCompose.services)) {
      resources[`LogGroup${serviceName}`] = {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
          LogGroupName: `!Join ['', [/ecs/, !Ref ServiceName, TaskDefinition${serviceName}]]`
        }
      };

      const commandArray = typeof serviceConfig.command === 'string'
        ? serviceConfig.command.split(' ')
        : Array.isArray(serviceConfig.command)
          ? serviceConfig.command
          : [];

      const ports = new Set<number>();
      serviceConfig.ports?.map((value) => { 
        ports.add(Number(value.split(':')[0]));
      });
      
      const environmentVariables: { [key: string]: string } = {};
      if (serviceConfig.environment) {
        Object.entries(serviceConfig.environment).forEach(([key, value]) => {
          if (value.includes('=')) {
            const [splitKey, splitValue] = value.split('=');
            environmentVariables[splitKey] = splitValue;
          } else {
            environmentVariables[key] = value;
          }
        });
      };

      resources[`TaskDefinition${serviceName}`] = {
        Type: 'AWS::ECS::TaskDefinition',
        DependsOn: `LogGroup${serviceName}`,
        Properties: {
          Family: `!Join ['', [!Ref ServiceName, TaskDefinition${serviceName}]]`,
          NetworkMode: 'awsvpc',
          RequiresCompatibilities: [
            'FARGATE'
          ],
          Cpu: defaultParserConfig.cpu,
          Memory: defaultParserConfig.memory,
          ExecutionRoleArn: '!Ref ExecutionRole',
          TaskRoleArn: '!Ref TaskRole',
          ContainerDefinitions: [
            {
              Name: serviceName,
              Command: commandArray,
              Image: getImageUrl(serviceConfig.image),
              PortMappings: [ ...Array.from(ports.values()).map((value) => {
                return { ContainerPort: value };
              }) ],
              Environment: Object.keys(environmentVariables).map(key => ({
                name: key,
                value: environmentVariables[key as keyof typeof environmentVariables]
              })),
              LogConfiguration: {
                LogDriver: 'awslogs',
                Options: {
                  'awslogs-region': '!Ref AWS::Region',
                  'awslogs-group': `!Ref LogGroup${serviceName}`,
                  'awslogs-stream-prefix': 'ecs'
                }
              }
            }
          ]
        }
      };

      resources[`ContainerSecurityGroup${serviceName}`] = {
        Type: 'AWS::EC2::SecurityGroup',
        Properties: {
          GroupDescription: `!Join ['', [${serviceName}, ContainerSecurityGroup]]`,
          VpcId: '!Ref VPC',
          SecurityGroupIngress: [ 
            ...Array.from(ports.values()).map((value) => { 
              return {
                IpProtocol: 'tcp',
                FromPort: value,
                ToPort: value,
                CidrIp: '0.0.0.0/0',
              };
            }) 
          ]
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
              SecurityGroups: [ `!Ref ContainerSecurityGroup${serviceName}` ]
            }
          }
        }
      };
    }

    response = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Deplo.my CFN template translated from Docker compose',
      Parameters: parameters,
      Resources: resources
    };

    switch (templateFormat) {
      case TemplateFormat.yaml:
        return this.replaceSpecialDirectives(formatResponse(JSON.stringify(response, null, 2), templateFormat));
      default:
        return formatResponse(JSON.stringify(response, null, 2), templateFormat);
    };
  }

  getInfo(): ParserInfo {
    return {
      providerWebsite: 'https://aws.amazon.com/cloudformation/',
      providerName: 'Amazon Web Services',
      provieerNameAbbreviation: 'AWS',      
      languageOfficialDocs: 'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html',
      languageAbbreviation: 'CFN',
      languageName: 'AWS CloudFormation',
      defaultParserConfig: defaultParserConfig
    };
  }
}

export default new CloudFormationParser();
