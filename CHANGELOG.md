# Changelog

# [1.23.0](https://github.com/deploystackio/docker-to-iac/compare/v1.22.2...v1.23.0) (2025-04-27)

### Features
* add Helm parser and database configuration support ([30eefa1](https://github.com/deploystackio/docker-to-iac/commit/30eefa1e7fc9293dc473dede87af6c4fb48253b3))
* add unit tests for Helm database utilities and connection detection ([c57ab3b](https://github.com/deploystackio/docker-to-iac/commit/c57ab3b30aafa2b473c12ff433d45ad83ed67801))
* added e2e test for helm lint - test6 ([8924428](https://github.com/deploystackio/docker-to-iac/commit/89244281fdb5f9b6e740ed383ba35659630a9a9b))
* enhance HelmParser to support dynamic image URL generation and command handling ([e02dfcc](https://github.com/deploystackio/docker-to-iac/commit/e02dfcc9c87a283e49e5fbd1663dfdc9cedeacab))
* enhance release process with branch name extraction and cleanup ([e0ca09a](https://github.com/deploystackio/docker-to-iac/commit/e0ca09abb475c1b3a23f9b81ba86ddce22d5a87e))
* update getImageUrl.test.ts and added database-types test for helm ([45bf2f6](https://github.com/deploystackio/docker-to-iac/commit/45bf2f67342f1ee0041b1b889191d25a36e585cd))
* update Helm templates to support multiple services with dynamic configuration ([fb7806b](https://github.com/deploystackio/docker-to-iac/commit/fb7806b14ccb4af535b4064de32c9cbcbc15a91a))

## [1.22.2](https://github.com/deploystackio/docker-to-iac/compare/v1.22.1...v1.22.2) (2025-04-25)

### Features
* add test for Portkey Gateway port and image verification; update RunCommandParser logic ([e6c4617](https://github.com/deploystackio/docker-to-iac/commit/e6c4617c73cec8ccc6f7c25bed8aecd99c520a7b))

## [1.22.1](https://github.com/deploystackio/docker-to-iac/compare/v1.22.0...v1.22.1) (2025-04-22)
### Chores

* chore: bump release-it from 18.1.2 to 19.0.1 [9486472]
* chore: bump @typescript-eslint/eslint-plugin from 8.29.1 to 8.30.1 [9c4f786]
* chore: bump @eslint/js from 9.24.0 to 9.25.0 [c3a6143]
* chore: bump @typescript-eslint/parser from 8.29.1 to 8.30.1 [98fe066]
* chore: bump eslint from 9.24.0 to 9.25.0 [07fff95]
* chore: bump @release-it/conventional-changelog from 10.0.0 to 10.0.1 [9e9a045]
* chore: bump @types/node from 22.14.0 to 22.14.1 [afc65b9]
* chore: bump @typescript-eslint/parser from 8.29.0 to 8.29.1 [5f3673c]
* chore: bump @typescript-eslint/eslint-plugin from 8.29.0 to 8.29.1 [7210b17]



### Bug Fixes
* add missing comma in tsconfig.json types array ([31e081f](https://github.com/deploystackio/docker-to-iac/commit/31e081f3a408522fdbcdf1207e42a8c9befbcac5))
* **assertions:** change warning to info for volume mounting validation in DigitalOcean ([c95f348](https://github.com/deploystackio/docker-to-iac/commit/c95f348c68c60389efe720f28b556c35313ee7ac))
* **dependencies:** remove node-fetch from package.json and package-lock.json ([26a3da8](https://github.com/deploystackio/docker-to-iac/commit/26a3da806c03394081923f380ab45f24a4b4effb))
* **package:** update description for clarity; add missing keyword in keywords array ([e10c0c0](https://github.com/deploystackio/docker-to-iac/commit/e10c0c08b64f36eda7394d8ff2dc166636678096))
* **render:** update database plan to 'free' for PostgreSQL configuration ([cc5e1e5](https://github.com/deploystackio/docker-to-iac/commit/cc5e1e5dca6255447bd93dc4d2165bff8e9356ec))
* **tests:** comment out import for runTest4 to prevent execution ([188c1ea](https://github.com/deploystackio/docker-to-iac/commit/188c1ea33b919f99820d91dabea97f729988c784))
* **tests:** remove redundant volume support validation in Docker Run test for DigitalOcean ([03b4e3d](https://github.com/deploystackio/docker-to-iac/commit/03b4e3dbf9e20f716dcb427ae9749fc2133904d2))

### Features
* **tests:** add comprehensive tests for Docker Run and Docker Compose port mappings; include validation for environment variables and YAML structure ([dc5fc2e](https://github.com/deploystackio/docker-to-iac/commit/dc5fc2e025e22a6f4aa6cdfb809306a32d0f2766))
* **tests:** add comprehensive unit tests for various utility functions including database service connections and image normalization ([13beba7](https://github.com/deploystackio/docker-to-iac/commit/13beba738ad3ca43b00b161aee173e9136a8e4fd))
* **tests:** add DigitalOcean translation tests for Docker Run and Docker Compose; validate environment variables and port mappings ([68f004b](https://github.com/deploystackio/docker-to-iac/commit/68f004bda9a86c1d6722804b9ab553c599a336ec))
* **tests:** add Test 3 for environment variable substitution using Docker Run and Docker Compose; include comprehensive validation for environment variables and YAML structure ([64ff2b8](https://github.com/deploystackio/docker-to-iac/commit/64ff2b80524d73a83f81aca18f894f7a74a069e9))
* **tests:** add Test 4 for Render Translation Only; include Docker Run and Docker Compose tests with output validation ([cc47f06](https://github.com/deploystackio/docker-to-iac/commit/cc47f06086f7ae13ba3f41e48b60e0cc001f7935))
* **tests:** add unit tests for connection properties, database types, and render service types configurations ([937c277](https://github.com/deploystackio/docker-to-iac/commit/937c27779b99b649e7556e2b8af8b6ed8ae83575))
* **tests:** add unit tests for various utility functions and integrate Vitest for testing framework ([378c349](https://github.com/deploystackio/docker-to-iac/commit/378c349ebb475fdd30458c1bbb5154216011cb33))
* **tests:** enhance CI workflow and add unit tests for RunCommandParser and Docker Compose validation ([5b2633d](https://github.com/deploystackio/docker-to-iac/commit/5b2633df52602c41902c431378b3ad254a02b4c9))
* **tests:** reintroduce schema validation for Docker Run and Docker Compose tests; add render schema validator utility ([ff0c45c](https://github.com/deploystackio/docker-to-iac/commit/ff0c45c1a61608ea31fabf74c6785f3467b2bc5e))

# [1.22.0](https://github.com/deploystackio/docker-to-iac/compare/v1.21.3...v1.22.0) (2025-04-11)

### Bug Fixes
* suppress eslint warnings for unused variables in service connection handling ([7a18378](https://github.com/deploystackio/docker-to-iac/commit/7a18378270870fdc4a9d1bb2c7b77ec0d8819d2c))

### Features
* enhance database and service connection handling for Render and DigitalOcean ([6063048](https://github.com/deploystackio/docker-to-iac/commit/6063048e5e0e028eeb0bbd7af30b50b22793b2a4))

## [1.21.3](https://github.com/deploystackio/docker-to-iac/compare/v1.21.2...v1.21.3) (2025-04-11)
### Chores

* chore: bump @eslint/js from 9.23.0 to 9.24.0 [9ebdc18]
* chore: bump @types/node from 22.13.14 to 22.14.0 [8942a46]
* chore: bump @typescript-eslint/parser from 8.28.0 to 8.29.0 [28ad47f]
* chore: bump @typescript-eslint/eslint-plugin from 8.28.0 to 8.29.0 [8132e03]
* chore: bump eslint from 9.23.0 to 9.24.0 [9b69589]



### Bug Fixes
* **run-command-parser:** improve argument parsing for docker run commands ([dd8f479](https://github.com/deploystackio/docker-to-iac/commit/dd8f4796eeb41f061584f8f1aed01da9148216c1))

## [1.21.2](https://github.com/deploystackio/docker-to-iac/compare/v1.21.1...v1.21.2) (2025-04-06)

### Bug Fixes
* **service-connections:** add service name transformation support for DigitalOcean ([24844fc](https://github.com/deploystackio/docker-to-iac/commit/24844fc8b229a864134ed52ff08c379ae49cb246))

## [1.21.1](https://github.com/deploystackio/docker-to-iac/compare/v1.21.0...v1.21.1) (2025-03-31)
### Chores

* chore: bump yaml from 2.7.0 to 2.7.1 [175e001]
* chore: bump @types/semver from 7.5.8 to 7.7.0 [54d7dbe]
* chore: bump @types/node from 22.13.13 to 22.13.14 [bf1e71b]

## [1.21.0](https://github.com/deploystackio/docker-to-iac/compare/v1.20.1...v1.21.0) (2025-03-30)

### Bug Fixes
* remove hardcoded environment type from RenderParser ([8fe96a1](https://github.com/deploystackio/docker-to-iac/commit/8fe96a10e427ff09929f558b5a191b0beb4624cb))

### Features
* enhance service connection handling with native references and update configurations ([3a2143e](https://github.com/deploystackio/docker-to-iac/commit/3a2143ed9c3a43a164b772947dc16db85ade478c))
* simplify service connection resolution by replacing service references in environment variables ([7b65d8a](https://github.com/deploystackio/docker-to-iac/commit/7b65d8a35c4956ed37726ec15046487203492734))
* update version to 1.20.1 and add service connection resolution functionality ([c870ee7](https://github.com/deploystackio/docker-to-iac/commit/c870ee76c2f5f91d2e151e73948f0b89bc5a211e))

## [1.20.1](https://github.com/deploystackio/docker-to-iac/compare/v1.20.0...v1.20.1) (2025-03-25)


### Bug Fixes

* **aws:** update CloudFormationParser to use formatted YAML content ([a90344c](https://github.com/deploystackio/docker-to-iac/commit/a90344ce5b721ac8aaeb340730a848cc0033df2a))

## [1.20.1](https://github.com/deploystackio/docker-to-iac/compare/v1.20.0...v1.20.1) (2025-03-24)

### Initial changelog entry for release-it migration
