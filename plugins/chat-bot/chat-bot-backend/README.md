# chat-bot

Welcome to the chat-bot backend plugin!

_This plugin was created through the Backstage CLI_

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn
start` in the root directory, and then navigating to [/chat-bot/health](http://localhost:7007/api/chat-bot/health).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.

TODO:

- install package
- preReq - auth.environement in app-config.yaml or local file

Modify you configuration file, for example:

```yaml
# In app-config.yaml

chatBot:
      key: AzureOpenAIAccessKey # Access key to yout instance of Azure OpenAI Services
      endpoint: AzureOpenAIEndpoint # Endpoint of your instance of Azure OpenAI Services
```

TODO:
- describe other configs
- model defaults