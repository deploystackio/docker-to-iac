# Changelog

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
