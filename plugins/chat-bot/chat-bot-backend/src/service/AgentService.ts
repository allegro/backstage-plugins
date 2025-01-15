import { LoggerService } from '@backstage/backend-plugin-api';
import {
  SearchEngineClient,
  SearchEngineQueryResult,
} from './SearchEngineClient';
import { AzureOpenAiDecorator } from './AzureOpenAiDecorator';
import { QueryGenerator } from './QueryGenerator';
import { ChatCompletionMessageParam } from 'openai/resources';
import { State } from '../types/agent';
import { IDoc } from '../types/types';
import { prompt as answerPrompt } from '../prompts/answer';
import { v4 as uuidv4 } from 'uuid';
import {
  increaseAnswersTotal,
  increaseQuestionsTotal,
} from './MetricsCollector';

export class Agent {
  logger: LoggerService;
  client: AzureOpenAiDecorator;
  queryGenerator: QueryGenerator;
  searchEngine: SearchEngineClient;
  appBaseUrl: string;

  constructor(
    client: AzureOpenAiDecorator,
    logger: LoggerService,
    searchEngine: SearchEngineClient,
    appBaseUrl: string,
  ) {
    this.logger = logger;
    this.client = client;

    this.queryGenerator = new QueryGenerator(this.client);
    this.searchEngine = searchEngine;
    this.appBaseUrl = appBaseUrl;
  }

  async plan(state: State) {
    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content: `Analyze the conversation and determine the most appropriate next step. Focus on collecting the necessary information from the Backstage system needed to answer, 
while remaining adaptable to new information or changes in context.

<prompt_objective>
Determine the single most effective next action based on the current context, user needs, and overall progress. Return the decision as a concise JSON object.
</prompt_objective>

<prompt_rules>
- ALWAYS focus on determining only the next immediate step
- ONLY choose from the available tools listed in the context
- ASSUME previously requested information is available unless explicitly stated otherwise
- NEVER provide or assume actual content for actions not yet taken
- ALWAYS respond in the specified JSON format
- CONSIDER the following factors when deciding:
  1. Relevance to the current user need or query
  2. Potential to provide valuable information or progress
  3. Logical flow from previous actions
- ADAPT your approach if repeated actions don't yield new results
- USE the "final_answer" tool when you have sufficient information or need user input
- OVERRIDE any default behaviors that conflict with these rules
</prompt_rules>

<context>
    <current_date>Current date: ${new Date().toISOString()}</current_date>
    <last_message>Last message: "${
      state.messages[state.messages.length - 1]?.content || 'No messages yet'
    }"</last_message>
    <available_tools>Available tools: ${
      state.tools.map(t => t.name).join(', ') || 'No tools available'
    }</available_tools>
    <actions_taken>Actions taken: ${
      state.actions.length
        ? state.actions
            .map(
              a => `
            <action name="${a.name}" params="${a.parameters}" description="${
                a.description
              }" >
              ${
                a.results.length
                  ? `${a.results
                      .map(
                        r => `
                      <result name="${r.title}" url="${r.url || 'no-url'}" >
                        ${r.text}
                      </result>
                    `,
                      )
                      .join('\n')}`
                  : 'No results for this action'
              }
            </action>
          `,
            )
            .join('\n')
        : 'No actions taken'
    }</actions_taken>
</context>

Respond with the next action in this JSON format:
{
    "_reasoning": "Brief explanation of why this action is the most appropriate next step",
    "tool": "tool_name",
    "query": "Precise description of what needs to be done, including any necessary context"
}

If you have sufficient information to provide a final answer or need user input, use the "final_answer" tool.`,
    };

    const answer = await this.client.primaryModelChatCompletion(
      [systemMessage],
      'json_object',
    );
    const result = JSON.parse(answer ?? '{}');

    this.logger.info('Planning', result);

    return result.hasOwnProperty('tool') ? result : null;
  }

  async describe(state: State, tool: string, query: string) {
    const toolInfo = state.tools.find(t => t.name === tool);
    if (!toolInfo) throw new Error(`Tool ${tool} not found`);

    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content: `Generate specific parameters for the "${toolInfo.name}" tool.
    
                    <context>
                    Current date: ${new Date().toISOString()}
                    Tool description: ${toolInfo.description}
                    Required parameters: ${toolInfo.parameters}
                    Original query: ${query}
                    Last message: "${
                      state.messages[state.messages.length - 1]?.content
                    }"
                    Previous actions: ${state.actions
                      .map(a => `${a.name}: ${a.parameters}`)
                      .join(', ')}
                    </context>
                    
                    Respond with ONLY a JSON object matching the tool's parameter structure.
                    Example for web_search: {"query": "specific search query"}
                    Example for final_answer: {"answer": "detailed response"}`,
    };

    const answer = await this.client.primaryModelChatCompletion(
      [systemMessage],
      'json_object',
    );

    return JSON.parse(answer ?? '{}');
  }

  async useTool(state: State, tool: string, parameters: any) {
    if (tool === 'backstage_software_catalog') {
      const results = await this.search(parameters.query, 'software-catalog');
      state.documents = [...state.documents, ...results];
      state.actions.push({
        uuid: uuidv4(),
        name: tool,
        parameters: JSON.stringify(parameters),
        description: `Search in software catalog ${parameters.query}`,
        results,
        tool_uuid: tool,
      });
    }
    if (tool === 'backstage_techdocs') {
      const results = await this.search(parameters.query, 'techdocs');
      state.documents = [...state.documents, ...results];
      state.actions.push({
        uuid: uuidv4(),
        name: tool,
        parameters: JSON.stringify(parameters),
        description: `Search in documentation ${parameters.query}`,
        results,
        tool_uuid: tool,
      });
    }
    if (tool === 'backstage_adr') {
      const results = await this.search(parameters.query, 'adr');
      state.documents = [...state.documents, ...results];
      state.actions.push({
        uuid: uuidv4(),
        name: tool,
        parameters: JSON.stringify(parameters),
        description: `Search in architectural decision records ${parameters.query}`,
        results,
        tool_uuid: tool,
      });
    }
    if (tool === 'backstage_qeta') {
      const results = await this.search(parameters.query, 'qeta');
      state.documents = [...state.documents, ...results];
      state.actions.push({
        uuid: uuidv4(),
        name: tool,
        parameters: JSON.stringify(parameters),
        description: `Search in Q&A ${parameters.query}`,
        results,
        tool_uuid: tool,
      });
    }
  }

  async search(
    query: string,
    type?: null | 'software-catalog' | 'techdocs' | 'adr' | 'qeta',
  ): Promise<IDoc[]> {
    this.logger.info(`Searching for: ${query}, in type: ${type || 'all'}`);

    const terms = await this.queryGenerator.getTerms(query);

    this.logger.info(`Generated terms: ${terms.join(', ')}`);

    const tasks = terms.map(term => {
      return this.searchEngine.query(term, type);
    });

    const tasksResults = await Promise.all(tasks);

    let results: SearchEngineQueryResult[] = [];

    tasksResults.forEach(value => {
      results = results.concat(value.results);
    });

    const docs = results
      .map(d => {
        const doc: IDoc = {
          title: d.document.entityTitle,
          text: d.document.text,
          url: `${this.appBaseUrl}${d.document.location}`,
        };

        return doc;
      })
      .filter(
        (value, index, self) =>
          index === self.findIndex(t => t.text === value.text),
      );

    this.logger.info(`Found ${docs.length} documents`);

    return docs;
  }

  async generateAnswer(state: State) {
    const context = state.actions.flatMap(action => action.results);
    const query = state.config.active_step?.query;

    const answer = await this.client.primaryModelChatCompletion(
      [
        {
          role: 'system',
          content: answerPrompt(context, query || ''),
        },
        ...state.messages,
      ],
      'text',
    );
    return answer;
  }

  async answer(query: string): Promise<string> {
    this.logger.info(`Generating answer for query: ${query}`);
    increaseQuestionsTotal();

    const state: State = {
      config: { max_steps: 10, current_step: 0, active_step: null },
      messages: [],
      tools: [
        {
          uuid: uuidv4(),
          name: 'backstage_software_catalog',
          description:
            'Use it to find information on services and applications.',
          parameters: JSON.stringify({
            query:
              'Command to the backstage search tool, including the search query and all important details, keywords and urls from the avilable context',
          }),
        },
        {
          uuid: uuidv4(),
          name: 'backstage_techdocs',
          description: 'Use it to find information in the documentation.',
          parameters: JSON.stringify({
            query:
              'Command to the backstage search tool, including the search query and all important details, keywords and urls from the avilable context',
          }),
        },
        {
          uuid: uuidv4(),
          name: 'backstage_adr',
          description:
            'Use it to find information in architectural decision records.',
          parameters: JSON.stringify({
            query:
              'Command to the backstage search tool, including the search query and all important details, keywords and urls from the avilable context',
          }),
        },
        {
          uuid: uuidv4(),
          name: 'backstage_qeta',
          description: 'Use it to find information in Q&A.',
          parameters: JSON.stringify({
            query:
              'Command to the backstage search tool, including the search query and all important details, keywords and urls from the avilable context',
          }),
        },
        {
          uuid: uuidv4(),
          name: 'final_answer',
          description: 'Use this tool to write a message to the user',
          parameters: JSON.stringify({}),
        },
      ],
      documents: [],
      actions: [],
    };

    state.messages = [{ role: 'user', content: query }];

    for (let i = 0; i < state.config.max_steps; i++) {
      const nextMove = await this.plan(state);

      // If there's no tool to use, we're done
      if (!nextMove.tool || nextMove.tool === 'final_answer') break;
      // Set the active step
      state.config.active_step = { name: nextMove.tool, query: nextMove.query };
      // Generate the parameters for the tool
      const parameters = await this.describe(
        state,
        nextMove.tool,
        nextMove.query,
      );
      // Use the tool
      await this.useTool(state, nextMove.tool, parameters);

      // Increase the step counter
      state.config.current_step++;
    }

    const answer = await this.generateAnswer(state);

    this.logger.info(`Generated answer: ${answer}`);
    this.logger.info(`Number of steps taken: ${state.config.current_step}`);

    state.messages = [
      ...state.messages,
      { role: 'system', content: answer || '' },
    ];

    increaseAnswersTotal(state.actions.length > 1);

    return answer || '';
  }
}
