import { ConflictException } from '@nestjs/common';

export class VariantTypeInUseException extends ConflictException {
  constructor(message: string, count: number) {
    super({ message, count });
  }
}
