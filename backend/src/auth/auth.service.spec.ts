import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { verify: jest.Mock };
  let prisma: { profile: { findUnique: jest.Mock } };

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };
    prisma = { profile: { findUnique: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('resuelve el usuario a partir de un token válido', async () => {
    jwtService.verify.mockReturnValue({ sub: 'u1' });
    prisma.profile.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'cajero',
      branchId: 'b1',
      fullName: 'Cajero',
      businessId: 'biz1',
    });

    const result = await service.resolveUserFromToken('token-valido');

    expect(result).toEqual({
      id: 'u1',
      role: 'cajero',
      branch_id: 'b1',
      full_name: 'Cajero',
      business_id: 'biz1',
    });
  });

  it('rechaza si el token es inválido o expiró', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(service.resolveUserFromToken('token-vencido')).rejects.toThrow(UnauthorizedException);
    expect(prisma.profile.findUnique).not.toHaveBeenCalled();
  });

  it('rechaza si el perfil no existe', async () => {
    jwtService.verify.mockReturnValue({ sub: 'u404' });
    prisma.profile.findUnique.mockResolvedValue(null);

    await expect(service.resolveUserFromToken('token-valido')).rejects.toThrow(UnauthorizedException);
  });
});
