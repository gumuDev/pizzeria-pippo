import { ConflictException } from '@nestjs/common';

export class BranchHasCashiersException extends ConflictException {
  constructor(message: string, cashiers: { id: string; full_name: string | null }[]) {
    super({ message, cashiers });
  }
}
