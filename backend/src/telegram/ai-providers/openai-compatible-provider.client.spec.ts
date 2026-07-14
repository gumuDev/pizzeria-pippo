import { OpenAiCompatibleProviderClient } from './openai-compatible-provider.client';

const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }));
});

describe('OpenAiCompatibleProviderClient', () => {
  let client: OpenAiCompatibleProviderClient;

  beforeEach(() => {
    mockCreate.mockReset();
    client = new OpenAiCompatibleProviderClient();
  });

  it('devuelve el contenido del primer choice, recortado', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '  hola  ' } }] });

    const result = await client.complete({ apiKey: 'key', model: 'qwen-plus', baseURL: 'https://example.com' }, 'system', 'hola');

    expect(result).toBe('hola');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: 'system' },
          { role: 'user', content: 'hola' },
        ],
      }),
    );
  });

  it('devuelve string vacío si no hay choices', async () => {
    mockCreate.mockResolvedValue({ choices: [] });

    const result = await client.complete({ apiKey: 'key', model: 'qwen-plus' }, 'system', 'hola');

    expect(result).toBe('');
  });
});
