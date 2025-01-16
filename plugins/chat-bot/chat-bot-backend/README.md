# ChatBot Backend

This ChatBot Backend plugin is primarily responsible for the following:

- Process prompts from users based on the search module consume index to find the best matching answers. We are consuming [Azure Open AI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) so you need to have an instance of service available and configured
- Provides endpoint for ChatBot dialog frontend plugin
- Provides endpoint for Slack integration
- Provides endpoint for Copilot integration

## Install

### Up and running

Steps to execute:

1. First we need to add the `@allegro/backstage-plugin-chat-bot-backend` package to your backend:

```sh
 # From your Backstage root directory
 yarn --cwd packages/backend add @allegro/backstage-plugin-chat-bot-backend
```

2. The ADR backend plugin has support for the [new backend system](https://backstage.io/docs/backend-system/), here's how you can set that up:

In your `packages/backend/src/index.ts` make the following changes:

```diff
  const backend = createBackend();

+ backend.add(import('@allegro/backstage-plugin-chat-bot-backend'));

// ... other feature additions

  backend.start();
```

### Setup Config

First, you need to be sure that you set up [search feature](https://backstage.io/docs/features/search/) and that your Tech Docs and other documentation you want to use are indexed properly.

Additionally, the plugin is used optionally for the development/debug reasons section:

```yaml
auth:
  environment: development
```

To set the plugin properly you need to provide at least.

```yaml
# In app-config.yaml

chatBot:
  key: AzureOpenAIAccessKey # Access key to your instance of Azure OpenAI Services
  endpoint: AzureOpenAIEndpoint # Endpoint of your instance of Azure OpenAI Services
```

Additionally, you can play with models of your choice.

```yaml
# In app-config.yaml
chatBot:
  chatCompletionPrimaryModel: gpt-4o # default
  chatCompletionSecondaryModel: gpt-4o-mini # default
  embeddingModel: text-embedding-ada-002-d1 # default
```

#### Slack integration

1. You need to set a list of slack channels that are allowed to use endpoints

```yaml
# In app-config.yaml
chatBot:
  slackChannels: [Backstage__ChatBot__Slack__Channel]
```

2. You need to configure `externalAccess` to endpoints, for example, static tokens like:

```yaml
# In app-config.yaml
backend:
  # Used for enabling authentication, the secret is shared by all backend plugins
  # See https://backstage.io/docs/auth/service-to-service-auth for
  # Information on the format
  auth:
    externalAccess:
      - type: static
        options:
          token: ${Backstage--SlackBot--Token}
          subject: index-search-for-help-slack-bot
        # Restrictions are optional; see below
        accessRestrictions:
 - plugin: chat-bot
```

3. TODO: Slack configuration

#### Copilot integration

1. You need to set a list of organizations that are allowed to use endpoints

```yaml
# In app-config.yaml
chatBot:
  copilot:
    github:
      allowedOrganizations:
        ['${Backstage__ChatBot__Copilot__Allowed__Organization}']
```

2. You need to configure `externalAccess` to endpoints, for example, static tokens like:

```yaml
# In app-config.yaml
backend:
  # Used for enabling authentication, the secret is shared by all backend plugins
  # See https://backstage.io/docs/auth/service-to-service-auth for
  # Information on the format
  auth:
    externalAccess:
      - type: static
        options:
          token: ${Backstage--Copilot--Token}
          subject: index-search-for-copilot
        # Restrictions are optional; see below
        accessRestrictions:
 - plugin: chat-bot
```

3. TODO: setup copilot

## How assistant works

### 1. User Interaction

The user begins by asking a question within the Backstage interface.

### 2. Multi-Query Retrieval

The assistant modifies the user's original question into multiple query variations using a multi-query retriever mechanism. This helps to capture different ways the question could be interpreted.

### 3. Search Execution

Each generated query is passed to the Backstage search engine, which retrieves the top 3 relevant results for each query.

### 4. Document Filtering

The results are processed using an [embeddings](https://platform.openai.com/docs/guides/embeddings) model. By applying [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity), the assistant identifies which documents most likely contain the answer to the user's question.

### 5. Context Building

The selected documents are passed to the AI model as context to provide relevant information for the answer generation.

### 6. Answer Generation

Using the provided context, the AI assistant generates a precise and informative response for the user.

## Working with source code

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn
start` in the root directory, and then navigate to [/chat-bot/health](http://localhost:7007/api/chat-bot/health).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.
