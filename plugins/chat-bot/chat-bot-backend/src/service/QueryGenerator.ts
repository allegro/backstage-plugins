import { AzureOpenAiDecorator } from './AzureOpenAiDecorator';

export interface QueryGeneratorTerms {
  terms: string[];
}

export class QueryGenerator {
  private readonly client: AzureOpenAiDecorator;

  private readonly systemPrompt: string = `Generate up to 10 optimized search queries based on the provided term. Ensure that half of the queries are short (one or two words) and the other half are longer, full-sentence queries. Use relevant synonyms, variations, and related terms to improve search accuracy and coverage. Each query should remain contextually relevant to the original term while varying in length and specificity to address different search intents.

<answer-json-schema>
{{
    'terms' : [
        'term' // You can add as many terms as you like
    ]
}}
</answer-json-schema>
    `;

  constructor(client: AzureOpenAiDecorator) {
    this.client = client;
  }

  getTerms = async (query: string) => {
    const completion = await this.client.secondaryModelChatCompletion(
      [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: 'What Pulumi is?' },
        {
          role: 'assistant',
          content: "{'terms' : ['Pulumi', 'IaC', 'Infrastructure as code']}",
        },
        { role: 'user', content: query },
      ],
      'json_object',
    );
    if (completion !== null) {
      const generatedTerms = JSON.parse(completion) as QueryGeneratorTerms;

      return generatedTerms.terms;
    }
    return [];
  };
}
