import { AnthropicProviderClient } from './anthropic-provider.client';

const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  }));
});

describe('AnthropicProviderClient', () => {
  let client: AnthropicProviderClient;

  beforeEach(() => {
    mockCreate.mockReset();
    client = new AnthropicProviderClient();
  });

  it('devuelve el texto de la respuesta, recortado', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'text', text: '  hola  ' }] });

    const result = await client.complete({ apiKey: 'key', model: 'claude-haiku-4-5-20251001' }, 'system', 'hola');

    expect(result).toBe('hola');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-haiku-4-5-20251001', system: 'system' }),
    );
  });

  it('devuelve string vacío si el bloque de respuesta no es texto', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'image' }] });

    const result = await client.complete({ apiKey: 'key', model: 'claude-haiku-4-5-20251001' }, 'system', 'hola');

    expect(result).toBe('');
  });
});
