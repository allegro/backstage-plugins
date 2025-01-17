import {
  createApiRef,
  FetchApi,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { DiscoveryApi } from '@backstage/core-plugin-api';
import {
  createApiFactory,
  discoveryApiRef,
} from '@backstage/frontend-plugin-api';
import {
  PromptRequest,
  PromptResponse,
} from '@allegro/backstage-plugin-chat-bot-common';

/**
 * {@link @backstage/core-plugin-api#ApiRef} for the {@link ChatApi}
 *
 * @public
 */
export const chatApiRef = createApiRef<ChatApi>({
  id: 'plugin.chatapi.service',
});

export enum HistoryItemSource {
  Bot,
  Person,
}

export type HistoryItem = {
  itemDate: Date;
  source: HistoryItemSource;
  content: string;
};

export interface ChatApi {
  prompt(prompt: PromptRequest): Promise<HistoryItem>;
  getHistory(): HistoryItem[];
}

/** @public */
class ChatApiClient implements ChatApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly history: Set<HistoryItem> = new Set();

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }
  async prompt(prompt: PromptRequest): Promise<HistoryItem> {
    const url = await this.discoveryApi.getBaseUrl('chat-bot');

    const personHistoryItem: HistoryItem = {
      content: prompt.content,
      itemDate: new Date(Date.now()),
      source: HistoryItemSource.Person,
    };

    const response = await this.fetchApi.fetch(`${url}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt),
    });

    throwOnErrorResponse(response);

    const responseBody = (await response.json()) as PromptResponse;

    this.history.add(personHistoryItem);
    const responseHistoryItem = {
      content: responseBody.content,
      itemDate: new Date(Date.now()),
      source: HistoryItemSource.Bot,
    };
    this.history.add(responseHistoryItem);

    return responseHistoryItem;
  }

  getHistory(): HistoryItem[] {
    return [...this.history];
  }
}

function throwOnErrorResponse(response: Response) {
  if (!response.ok) {
    if (response.statusText) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    throw new Error(`Response status: ${response.status}`);
  }
}

export const chatApiFactory = createApiFactory({
  api: chatApiRef,
  deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
  factory: ({ discoveryApi, fetchApi }) =>
    new ChatApiClient({ discoveryApi, fetchApi }),
});
