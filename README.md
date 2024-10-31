# Docker-to-IaC

A Node.js module to translate Docker Compose files into AWS CloudFormation and more...

## Installation

First, install the module and its dependencies:

```sh
npm i @deploystack/docker-to-iac
```

## Usage

### Translating Docker Compose to AWS CloudFormation

```typescript
import { translate } from '@deploystack/docker-to-iac';
import { readFileSync, writeFileSync } from 'fs';

// Read Docker Compose file content as plain text
const dockerComposeContent = readFileSync('path/to/docker-compose.yml', 'utf8');

const translatedConfig = translate(dockerComposeContent, 'CFN');
console.log(translatedConfig);

// Write the translated config to a file
writeFileSync('output-aws.json', JSON.stringify(translatedConfig, null, 2));
```

## Documentation

Please visit [docs.deploystack.io](https://docs.deploystack.io/docker-to-iac) to read full documentation.

## License

This project is licensed under the Apache 2.0 License.