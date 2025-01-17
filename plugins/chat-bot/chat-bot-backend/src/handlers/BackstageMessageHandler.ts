import { Agent } from '../service/AgentService';

export class BackstageMessageHandler {
  private readonly agent: Agent;
  constructor(agent: Agent) {
    this.agent = agent;
  }

  handle(message: string): Promise<string> {
    return this.agent.answer(message);
  }
}
