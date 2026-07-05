import { IsBoolean } from 'class-validator';

export class ToggleBanUserDto {
  @IsBoolean()
  ban!: boolean;
}
