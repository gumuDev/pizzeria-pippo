import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  full_name!: string;

  @IsIn(['admin', 'cajero', 'cocinero'])
  role!: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;

  // Opcional: permite a un admin resetear la contraseña de un usuario.
  // Sin esto no habría forma de recuperar el acceso de un usuario que
  // olvidó su contraseña, ya que no existe un flujo de "olvidé mi clave".
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
