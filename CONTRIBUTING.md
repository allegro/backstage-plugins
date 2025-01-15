# Contributing

## Pull requests

- for small changes, no need to add separate issue, defining problem in pull request is enough
- if issue exists, reference it from PR title or description using GitHub magic words like _resolves #issue-number_
- before making significant changes, please contact us via issues to discuss your plans and decrease number of changes after Pull Request is created
- create pull requests to **main** branch
- recommended to use conventional commits standard
- when updating a package, make sure to:
  - update its README.md
  - update its CHANGELOG.md
  - update its version
  - consider presenting usage in plugin `Readme`
  - add tests
- when creating a new package, make sure to:
  - maintain the repo structure (see existing packages)
  - create the package's README.md
  - initialize the package's CHANGELOG.md
  - add tests
  - consider presenting usage in plugin `Readme`

## Coding style

The coding style is guarded by the analyzers (such as prettier and lint).
Make sure to follow the defined standards.
