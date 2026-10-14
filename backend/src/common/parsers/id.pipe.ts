import { Injectable, PipeTransform } from '@nestjs/common';

import { parseIdDaRota } from './id.parser';

@Injectable()
export class IdPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    return parseIdDaRota(valor);
  }
}
