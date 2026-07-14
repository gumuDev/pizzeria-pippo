import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { AiProviderClient } from './ai-provider-client.interface';
import type { AiCompletionConfig } from './ai-completion-config.types';

@Injectable()
export class AnthropicProviderClient implements AiProviderClient {
  async complete(config: AiCompletionConfig, system: string, userMessage: string): Promise<string> {
    const client = new Anthropic({ apiKey: config.apiKey });
    const response = await client.messages.create({
      model: config.model,
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: userMessage }],
    });
    return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  }
}
