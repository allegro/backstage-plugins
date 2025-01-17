import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import { SearchEngineClient } from './SearchEngineClient';
import {
  createAckEvent,
  createTextEvent,
  createDoneEvent,
} from './copilot-utils';

import {
  PromptResponse,
  PromptRequest,
} from '@allegro/backstage-plugin-chat-bot-common';
// In GitHub Copilot examples, they use Octokit from @octokit/core. However, this is an ES module and doesn't work with Backstage, which uses CommonJS modules in the backend.
// So, I've switched to @octokit/rest in an older version (18.12.0), which is a CommonJS module and works with Backstage.
// full story: https://github.com/backstage/backstage/issues/12218?t
import { Octokit } from '@octokit/rest';
import { SlackEventData } from '../types/slack';
import { Agent } from './AgentService';
import { BackstageMessageHandler } from '../handlers/BackstageMessageHandler';
import { SlackMessageHandler } from '../handlers/SlackMessageHandler';
import { AzureOpenAiDecorator } from './AzureOpenAiDecorator';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  discovery: DiscoveryService;
  auth: AuthService;
}

export interface ChatBotConfiguration {
  key: string;
  endpoint: string;
  chatCompletionPrimaryModel: string | undefined;
  chatCompletionSecondaryModel: string | undefined;
  embeddingModel: string | undefined;
  slackChannels: string[];
}
// TODO: slack

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, discovery, auth } = options;

  const appBaseUrl = config.getString('app.baseUrl');
  const botConfig = config.getOptional<ChatBotConfiguration>('chatBot');
  const searchEngineClient = new SearchEngineClient(discovery, auth);

  let backstageMessageHandler: BackstageMessageHandler | undefined;
  let slackMessageHandler: SlackMessageHandler | undefined;

  if (botConfig && botConfig.key) {
    const client = new AzureOpenAiDecorator(
      logger,
      botConfig.endpoint,
      botConfig.key,
      botConfig.chatCompletionPrimaryModel,
      botConfig.chatCompletionSecondaryModel,
      botConfig.embeddingModel,
    );
    const agent = new Agent(client, logger, searchEngineClient, appBaseUrl);

    backstageMessageHandler = new BackstageMessageHandler(agent);
    slackMessageHandler = new SlackMessageHandler(client, agent);
  } else {
    logger.warn('Missing chat bot configuration');
  }

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.post('/prompt', async (request, response) => {
    const body = request.body as PromptRequest;
    const answer = backstageMessageHandler
      ? await backstageMessageHandler?.handle(body.content)
      : 'Chat bot not configured';

    const promptResponse: PromptResponse = {
      request: body,
      content: answer,
    };
    response.json(promptResponse);
  });

  router.post('/copilot', async (request, response) => {
    try {
      const tokenForUser = request.get('X-GitHub-Token');
      if (!tokenForUser) {
        logger.error('Unauthorized request - missing GitHub token');
        response.status(401).json({ error: 'GitHub token required' });
        return;
      }

      const octokit = new Octokit({ auth: tokenForUser });
      try {
        const { data: orgs } = await octokit.orgs.listForAuthenticatedUser({
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });
        const allowedOrgs = config.getStringArray(
          'chatBot.copilot.github.allowedOrganizations',
        );
        const isAllegroMember = orgs.some((org: { login: string }) =>
          allowedOrgs.includes(org.login),
        );

        if (!isAllegroMember) {
          logger.error('User is not a member of allegro-internal organization');
          response
            .status(403)
            .json({ error: 'Not a member of required organization' });
          return;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        logger.error('Error checking organization membership:', {
          error: errorMessage,
        });
        response
          .status(403)
          .json({ error: 'Not a member of required organization' });
        return;
      }

      response.write(createAckEvent());
      const payload = request.body;
      const messages = payload.messages;
      const latestMessage = messages[messages.length - 1];
      const answer = backstageMessageHandler
        ? await backstageMessageHandler?.handle(latestMessage?.content || '')
        : 'Chatbot is not configured';

      response.write(createTextEvent(answer));
      response.write(createDoneEvent());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error processing backstage request:', {
        error: errorMessage,
      });
      response.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/slack/event', async (request, response) => {
    const body = request.body as SlackEventData;

    if (botConfig!.slackChannels.indexOf(body.event.channel) === -1) {
      response.sendStatus(400);
      return;
    }

    if (body.event.type !== 'app_mention') {
      response.sendStatus(400);
      return;
    }

    const query = body.event.text;

    if (query === undefined || query === null || query === '') {
      response.sendStatus(400);
      return;
    }

    const answer = slackMessageHandler
      ? await slackMessageHandler?.handle(query!)
      : 'Chat bot not configured';

    const promptResponse: PromptResponse = {
      request: {
        content: query,
      },
      content: answer,
    };

    response.json(promptResponse);
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
