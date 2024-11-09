import { translate, getParserInfo, listAllParsers, listServices } from '../src/index';
import { TemplateFormat } from '../src/parsers/base-parser';
import { writeFileSync, readFileSync } from 'fs';

const awsInfo = getParserInfo('CFN');
console.log('AWS CloudFormation Info:');
console.log(awsInfo);

const renderInfo = getParserInfo('RND');
console.log('Render Info:');
console.log(renderInfo);

// Read the Docker Compose file as plain text
const dockerComposeContent = readFileSync('test/sample-docker-compose-simple.yml', 'utf8');

// =================================================================================================

// Testing AWS CloudFormation Text
const awsConfigPlain = translate(dockerComposeContent, 'CFN', TemplateFormat.text);
console.log(`AWS CloudFormation ${TemplateFormat.text}:`);
console.log(awsConfigPlain);
writeFileSync(`test/output/output-aws-${TemplateFormat.text}.txt`, awsConfigPlain);

// Testing AWS CloudFormation JSON
const awsConfigJson = translate(dockerComposeContent, 'CFN', TemplateFormat.json);
console.log(`AWS CloudFormation ${TemplateFormat.json}:`);
console.log(awsConfigJson);
writeFileSync(`test/output/output-aws-${TemplateFormat.json}.json`, JSON.stringify(awsConfigJson, null, 2));

// Testing AWS CloudFormation YAML
const awsConfigYaml = translate(dockerComposeContent, 'CFN'); // Defualt Test
console.log(`AWS CloudFormation ${TemplateFormat.yaml}:`);
console.log(awsConfigYaml);
writeFileSync(`test/output/output-aws-${TemplateFormat.yaml}.yml`, awsConfigYaml);

// =================================================================================================

// Testing Render Text
const renderConfigText = translate(dockerComposeContent, 'RND', TemplateFormat.text);
console.log('Render Text:');
console.log(renderConfigText);
writeFileSync(`test/output/output-render-${TemplateFormat.text}.txt`, renderConfigText);

// Testing Render JSON
const renderConfigJson = translate(dockerComposeContent, 'RND', TemplateFormat.json);
console.log('Render JSON:');
console.log(renderConfigJson);
writeFileSync(`test/output/output-render-${TemplateFormat.json}.json`, JSON.stringify(renderConfigJson, null, 2));

// Testing Render YAML
const renderConfigYaml = translate(dockerComposeContent, 'RND'); // Defualt Test
console.log('Render YAML:');
console.log(renderConfigYaml);
writeFileSync(`test/output/output-render-${TemplateFormat.yaml}.yaml`, renderConfigYaml);

// =================================================================================================

// Testing DigitalOcean YAML
const digitaloceanConfigYaml = translate(dockerComposeContent, 'DOP', TemplateFormat.yaml);
console.log('DigitalOcean YAML:');
console.log(digitaloceanConfigYaml);
writeFileSync(`test/output/output-digitalocean-${TemplateFormat.yaml}.yml`, digitaloceanConfigYaml);

// Testing DigitalOcean JSON
const digitaloceanConfigJson = translate(dockerComposeContent, 'DOP', TemplateFormat.json);
console.log('DigitalOcean JSON:');
console.log(digitaloceanConfigJson);
writeFileSync(`test/output/output-digitalocean-${TemplateFormat.json}.json`, JSON.stringify(digitaloceanConfigJson, null, 2));

// Testing DigitalOcean Text
const digitaloceanConfigText = translate(dockerComposeContent, 'DOP', TemplateFormat.text);
console.log('DigitalOcean Text:');
console.log(digitaloceanConfigText);
writeFileSync(`test/output/output-digitalocean-${TemplateFormat.text}.txt`, digitaloceanConfigText);

// =================================================================================================

// List all available parsers
const parsers = listAllParsers();

console.log('Available Parsers:');
console.log(parsers);


// List all available services within docker-compose file
const services = listServices(dockerComposeContent);

console.log('List Services:');
console.log(services);
