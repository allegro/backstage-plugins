import { Agent } from '../service/AgentService';
import { AzureOpenAiDecorator } from '../service/AzureOpenAiDecorator';
import { prompts } from '../prompts/slack';

export class SlackMessageHandler {
  private readonly notFoundDataMessage =
    "Uh-oh, seems like we're on a wild goose chase. Couldn't find the data you're looking for. Try checking your input and let's give it another go!";
  private readonly client: AzureOpenAiDecorator;
  private readonly agent: Agent;

  constructor(client: AzureOpenAiDecorator, agent: Agent) {
    this.client = client;
    this.agent = agent;
  }

  async handle(message: string): Promise<string> {
    const answer = await this.agent.answer(message);
    const slackFormat = await this.client.primaryModelChatCompletion(
      [...prompts, { role: 'user', content: answer }],
      'text',
      0.8,
    );

    return slackFormat ?? this.notFoundDataMessage;
  }
}
