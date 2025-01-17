import promClient from 'prom-client';

const chatbot_input_tokens_total = new promClient.Counter({
  name: 'chatbot_input_tokens_total',
  help: 'Number of input tokens',
  labelNames: ['modelName'],
});

const chatbot_output_tokens_total = new promClient.Counter({
  name: 'chatbot_output_tokens_total',
  help: 'Number of output tokens',
  labelNames: ['modelName'],
});

const chatbot_questions_total = new promClient.Counter({
  name: 'chatbot_questions_total',
  help: 'Number of asked questions',
});

const chatbot_answers_total = new promClient.Counter({
  name: 'chatbot_answers_total',
  help: 'Number of answers',
  labelNames: ['basedOnBackstage'],
});

promClient.register.registerMetric(chatbot_input_tokens_total);
promClient.register.registerMetric(chatbot_output_tokens_total);
promClient.register.registerMetric(chatbot_questions_total);
promClient.register.registerMetric(chatbot_answers_total);

export function increaseInputTokens(
  tokens: number | undefined,
  modelName: string,
) {
  if (tokens === undefined) {
    return;
  }
  chatbot_input_tokens_total.labels({ modelName: modelName }).inc(tokens);
}

export function increaseOutputTokens(
  tokens: number | undefined,
  modelName: string,
) {
  if (tokens === undefined) {
    return;
  }
  chatbot_output_tokens_total.labels({ modelName: modelName }).inc(tokens);
}

export function increaseQuestionsTotal() {
  chatbot_questions_total.inc();
}

export function increaseAnswersTotal(basedOnBackstage: boolean) {
  chatbot_answers_total
    .labels({ basedOnBackstage: `${basedOnBackstage}` })
    .inc();
}
