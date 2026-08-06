# Security Policy

## Supported versions

Only the latest published release of `@deploystack/docker-to-iac` receives
security fixes. Older versions are not patched — if you are affected by an
advisory, upgrade to the current release.

| Version    | Supported |
|------------|-----------|
| 1.24.x     | Yes       |
| < 1.24.0   | No        |

## Reporting a vulnerability

Please report security vulnerabilities privately to **hello@deploystack.io**.

Do not open a public GitHub issue for a security problem — public issues
disclose the vulnerability before a fix is available.

Include whatever you have:

- A description of the issue and why you believe it is a security problem
- The version of `@deploystack/docker-to-iac` you tested against
- Steps to reproduce, ideally a minimal `docker run` command or Compose file
  and the target parser (`CFN`, `RND`, `DOP`, `HELM`)
- The generated output that demonstrates the issue, if relevant

You can expect an acknowledgement within a few working days. We will confirm
whether the report is accepted, agree an embargo period if a fix is needed,
and credit you in the release notes unless you prefer otherwise.

## Scope

This library translates Docker configurations into Infrastructure as Code
templates. It parses untrusted input (`docker run` strings, Compose files) and
generates provider templates, so the issues most relevant here are:

- Input that causes the parser to crash, hang, or consume unbounded resources
- Input that injects unintended content into a generated template — for
  example, escaping a YAML string context to add or alter fields
- Generated templates that expose secrets, such as environment variables or
  generated passwords appearing in output that is expected to be safe to commit
- Flaws in generated environment variable values that make them predictable

Out of scope:

- Vulnerabilities in the cloud providers themselves, or in a template you wrote
  by hand
- The security of infrastructure you deploy using a generated template — review
  generated output before deploying it
- Vulnerabilities in dependencies, unless this library's use of the dependency
  is what makes it exploitable. Report those upstream; Dependabot tracks them
  here.
