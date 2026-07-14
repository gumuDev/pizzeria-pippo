import { ConflictException } from '@nestjs/common';

export class BranchHasDependenciesException extends ConflictException {
  constructor(message: string) {
    super({ message });
  }
}
