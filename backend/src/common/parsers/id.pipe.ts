import { Injectable, PipeTransform } from '@nestjs/common';

import { parseRouteId } from './id.parser';

@Injectable()
export class IdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    return parseRouteId(value);
  }
}
