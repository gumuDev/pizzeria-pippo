import type { AiCompletionConfig } from './ai-completion-config.types';

export interface AiProviderClient {
  complete(config: AiCompletionConfig, system: string, userMessage: string): Promise<string>;
}
