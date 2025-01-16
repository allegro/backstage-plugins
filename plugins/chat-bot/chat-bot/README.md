# Backstage Assistant

![Screenshot of Tech Radar plugin](./docs/image.png)

This Spotify Backstage plugin integrates an AI-powered assistant using [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service) and the [Backstage search engine](https://github.com/backstage/backstage/tree/master/plugins/search) to provide smart, contextual responses to your questions. The assistant can automate routine tasks, offer intelligent suggestions, and help you quickly find relevant information within your Backstage environment. Designed to enhance productivity, it seamlessly integrates into your workflow, making it easier to manage and interact with Spotify services.

## Install

### Up and running

Steps to execute:

1. First we need to add the `@allegro/backstage-plugin-chat-bot` package to your backend:

```sh
 # From your Backstage root directory
 yarn --cwd packages/app add @allegro/backstage-plugin-chat-bot
```

2. Make sure the [@allegro/backstage-plugin-chat-bot-backend](../chat-bot-backend/README.md) is installed.

3. Modify your app routes to include the ChatButton component, for example:

```tsx
// In packages/app/src/App.tsx
import { ChatButton } from '@internal/backstage-plugin-chat-bot';

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
      <RequirePermission
        permission={/* Permissions required to use assistant, if any */}
        errorPage={<></>}
      >
        <ChatButton />
      </RequirePermission>
    </AppRouter>
  </>,
);
```

## Working with source code

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn
start` in the root directory, and then navigate to [home](http://localhost:3000).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.
