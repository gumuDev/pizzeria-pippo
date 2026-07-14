import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import type { AiProviderClient } from './ai-provider-client.interface';
import type { AiCompletionConfig } from './ai-completion-config.types';

@Injectable()
export class OpenAiCompatibleProviderClient implements AiProviderClient {
  async complete(config: AiCompletionConfig, system: string, userMessage: string): Promise<string> {
    const client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    });
    const response = await client.chat.completions.create({
      model: config.model,
      max_tokens: 512,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content?.trim() ?? '';
  }
}
