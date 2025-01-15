import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { chatBotPlugin, ChatBotPage } from '../src/plugin';

createDevApp()
  .registerPlugin(chatBotPlugin)
  .addPage({
    element: <ChatBotPage />,
    title: 'Root Page',
    path: '/chat-bot',
  })
  .render();
