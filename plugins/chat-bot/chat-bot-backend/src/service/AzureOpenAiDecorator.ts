import { AzureOpenAI } from 'openai';
import { increaseInputTokens, increaseOutputTokens } from './MetricsCollector';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  ResponseFormatJSONObject,
  ResponseFormatJSONSchema,
  ResponseFormatText,
} from 'openai/resources';

export class AzureOpenAiDecorator {
  private readonly client: AzureOpenAI;
  private readonly chatCompletionPrimaryModel: string;
  private readonly chatCompletionSecondaryModel: string;
  private readonly embeddingsModel: string;
  private readonly logger: LoggerService;

  constructor(
    logger: LoggerService,
    endpoint: string,
    key: string,
    chatCompletionPrimaryModel: string | undefined,
    chatCompletionSecondaryModel: string | undefined,
    embeddingsModel: string | undefined,
  ) {
    this.client = new AzureOpenAI({
      apiKey: key,
      endpoint: endpoint,
      apiVersion: '2024-06-01',
    });

    this.logger = logger;
    this.chatCompletionPrimaryModel = chatCompletionPrimaryModel || 'gpt-4o';
    this.chatCompletionSecondaryModel =
      chatCompletionSecondaryModel || 'gpt-4o-mini';
    this.embeddingsModel = embeddingsModel || 'text-embedding-ada-002-d1';
  }

  primaryModelChatCompletion(
    messages: ChatCompletionMessageParam[],
    responseFormat: 'text' | 'json_object' = 'text',
    temperature: number | null = null,
  ): Promise<string | null> {
    return this.chatCompletion(
      this.chatCompletionPrimaryModel,
      messages,
      responseFormat,
      temperature,
    );
  }

  secondaryModelChatCompletion(
    messages: ChatCompletionMessageParam[],
    responseFormat: 'text' | 'json_object' = 'text',
    temperature: number | null = null,
  ): Promise<string | null> {
    return this.chatCompletion(
      this.chatCompletionSecondaryModel,
      messages,
      responseFormat,
      temperature,
    );
  }

  async embedding(input: string): Promise<number[]> {
    try {
      const embedding = await this.client.embeddings.create({
        model: this.embeddingsModel,
        input: input,
      });

      increaseInputTokens(embedding.usage?.prompt_tokens, this.embeddingsModel);

      return embedding.data[0]?.embedding;
    } catch (error) {
      this.logger.error('Embedding generation failed', error as Error);
      return [];
    }
  }

  private async chatCompletion(
    modelName: string,
    messages: ChatCompletionMessageParam[],
    responseFormat: 'text' | 'json_object' = 'text',
    temperature: number | null = null,
  ): Promise<string | null> {
    try {
      let format:
        | ResponseFormatText
        | ResponseFormatJSONObject
        | ResponseFormatJSONSchema;

      switch (responseFormat) {
        case 'json_object':
          format = { type: 'json_object' };
          break;
        case 'text':
        default:
          format = { type: 'text' };
          break;
      }

      const completion = await this.client.chat.completions.create({
        model: modelName,
        messages: messages,
        response_format: format,
        temperature: temperature,
      });

      increaseInputTokens(completion.usage?.prompt_tokens, modelName);
      increaseOutputTokens(completion.usage?.completion_tokens, modelName);

      const answer = completion.choices[0].message?.content;

      return answer;
    } catch (error) {
      this.logger.error('Chat completion failed', error as Error);
      return null;
    }
  }
}
