import { PasswordHasherService } from './password-hasher.service';

describe('PasswordHasherService', () => {
  let service: PasswordHasherService;

  beforeEach(() => {
    service = new PasswordHasherService();
  });

  it('genera un hash distinto del texto plano y lo verifica correctamente', async () => {
    const hash = await service.hash('mi-password-123');

    expect(hash).not.toBe('mi-password-123');
    await expect(service.compare('mi-password-123', hash)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta contra un hash existente', async () => {
    const hash = await service.hash('mi-password-123');

    await expect(service.compare('otra-cosa', hash)).resolves.toBe(false);
  });

  it('verifica un hash bcrypt real generado por GoTrue (Supabase Auth)', async () => {
    // Hash real, sacado de auth.users.encrypted_password de la instancia local
    // de Supabase para el usuario admin@pippo.local (password: admin1234).
    // Prueba directa de compatibilidad bcryptjs <-> golang.org/x/crypto/bcrypt.
    const gotrueHash = '$2a$06$5cxZ7OALdZ3DecJvcJqrbekdjCIuQEnvyypOEAp2Wef7iaEkc/QEa';

    await expect(service.compare('admin1234', gotrueHash)).resolves.toBe(true);
  });
});
