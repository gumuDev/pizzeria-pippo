import { BadRequestException } from '@nestjs/common';

export class InsufficientStockException extends BadRequestException {
  constructor(message: string, available: number) {
    super({ message, available });
  }
}
