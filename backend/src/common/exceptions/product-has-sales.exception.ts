import { ConflictException } from '@nestjs/common';

export class ProductHasSalesException extends ConflictException {
  constructor(message: string) {
    super({ message });
  }
}
