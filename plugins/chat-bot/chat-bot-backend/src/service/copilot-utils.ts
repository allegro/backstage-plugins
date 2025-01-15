/** Those functions are from: 
  https://github.com/copilot-extensions/preview-sdk.js/blob/main/lib/response.js 

  So in the future, we can use the functions from the library instead of copying them here.
*/

/** @type {import('..').CreateAckEventInterface} */
export function createAckEvent() {
  return createTextEvent('');
}

/** @type {import('..').CreateTextEventInterface} */
export function createTextEvent(message: string) {
  const data = {
    choices: [
      {
        index: 0,
        delta: { content: message, role: 'assistant' },
      },
    ],
  };
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** @type {import('..').CreateDoneEventInterface} */
export function createDoneEvent() {
  const data = {
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        delta: { content: null },
      },
    ],
  };
  return `data: ${JSON.stringify(data)}\n\ndata: [DONE]\n\n`;
}
