/***/
/**
 * Common functionalities for the chat-bot plugin.
 *
 * @packageDocumentation
 */

export type PromptRequest = {
  content: string;
};

export type PromptResponse = {
  request: PromptRequest;
  content: string;
};
