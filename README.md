# Allegro Backstage Plugins

## Getting started

Setup local environement:

```sh
yarn install
yarn husky init
```

## [Backstage](https://backstage.io)

Repo is based on Bacstage from scaffolder, that is upgraded time to time to the newest Backstage version and core packages.

To start the app, run:

```sh
yarn install
yarn dev
```

## Add new package

We want to keep each package in dedicated folder under `./plugins`. Additionaly we based scripts on `backstage-cli` that creates plugins directly in `./plugins`. Therefore steps to create new package are:

1. type `yarn new` and follow wizard
2. move newly created plugin to dedicated plugin folder (existing or create new one)

## Plugins

All plugins and its related documentation, code and changelog might be found under [/plugins](./plugins/README.md) directory. Please explore.

Plugins are published to [https://registry.npmjs.org](https://registry.npmjs.org) in `@allegro` scope.

## License

Copyright Allegro Group

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
