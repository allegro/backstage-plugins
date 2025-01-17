import {
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { chatApiFactory } from './alpha/apis';

export const chatBotPlugin = createPlugin({
  id: 'chat-bot',
  routes: {
    root: rootRouteRef,
  },
  apis: [chatApiFactory],
});

export const ChatBotPage = chatBotPlugin.provide(
  createRoutableExtension({
    name: 'ChatBotPage',
    component: () =>
      import('./components/ChatComponent').then(m => m.ChatButton),
    mountPoint: rootRouteRef,
  }),
);

export const ChatButton = chatBotPlugin.provide(
  createComponentExtension({
    name: 'ChatButton',
    component: {
      lazy: () => import('./components/ChatComponent').then(m => m.ChatButton),
    },
  }),
);
