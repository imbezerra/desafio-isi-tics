import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { PLAYER_CONDITIONS, PLAYER_POSITIONS } from '../../common/domain.types';
import { parseQueryId } from '../../common/parsers/id.parser';
import { parseOption, parseText } from '../../common/parsers/input.parser';
import { PlayerQuery, PLAYER_SORT_OPTIONS } from '../dto/player.dto';

function queryText(value: unknown): string {
  if (typeof value !== 'string' || value === '') {
    throw new BadRequestException('Parâmetro de consulta inválido.');
  }
  return value;
}

function queryInteger(
  value: unknown,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined) return defaultValue;
  const number = parseQueryId(queryText(value));
  if (number < minimum || number > maximum) throw new BadRequestException('Inteiro fora da faixa.');
  return number;
}

function queryValue(value: unknown, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const text = queryText(value);
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(text) || Number(text) > 550) {
    throw new BadRequestException('Valor deve estar entre 0 e 550, com até duas casas decimais.');
  }
  return Number(text);
}

@Injectable()
export class PlayersQueryPipe implements PipeTransform<Record<string, unknown>, PlayerQuery> {
  transform(params: Record<string, unknown>): PlayerQuery {
    const sort = params.sort === undefined ? ['name'] : queryText(params.sort).split(',');
    const fields = sort.map((value) => value.split('_')[0]);
    if (sort.length > 2 || new Set(fields).size !== sort.length) {
      throw new BadRequestException('Use até dois critérios sem repetir o campo de ordenação.');
    }
    const query: PlayerQuery = {
      search: params.search === undefined ? undefined : parseText(params.search, 'search', 2, 100),
      position:
        params.position === undefined
          ? undefined
          : parseOption(params.position, 'position', PLAYER_POSITIONS),
      condition:
        params.condition === undefined
          ? undefined
          : parseOption(params.condition, 'condition', PLAYER_CONDITIONS),
      free:
        params.free === undefined
          ? undefined
          : parseOption(params.free, 'free', ['true', 'false']) === 'true',
      clubId: params.club_id === undefined ? undefined : parseQueryId(queryText(params.club_id)),
      minAge: queryInteger(params.min_age, 16, 16, 45),
      maxAge: queryInteger(params.max_age, 45, 16, 45),
      minValue: queryValue(params.min_value, 0),
      maxValue: queryValue(params.max_value, 550),
      sort: sort.map((value) => parseOption(value, 'sort', PLAYER_SORT_OPTIONS)),
      page: queryInteger(params.page, 1, 1, 2_147_483_647),
      limit: queryInteger(params.limit, 10, 1, 50),
    };
    if (
      query.minAge > query.maxAge ||
      query.minValue > query.maxValue ||
      (query.free === true && query.clubId !== undefined)
    ) {
      throw new BadRequestException('Combinação contraditória de filtros.');
    }
    return query;
  }
}
