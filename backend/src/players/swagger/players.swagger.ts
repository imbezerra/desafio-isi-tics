import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

import { PLAYER_CONDITIONS, PLAYER_POSITIONS } from '../../common/domain.types';

export function documentPlayersQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Trecho do nome, de 2 a 100 caracteres; ignora acentos e caixa.',
    }),
    ApiQuery({ name: 'position', required: false, enum: PLAYER_POSITIONS }),
    ApiQuery({ name: 'condition', required: false, enum: PLAYER_CONDITIONS }),
    ApiQuery({ name: 'free', required: false, enum: ['true', 'false'] }),
    ApiQuery({ name: 'club_id', required: false, type: Number }),
    ApiQuery({ name: 'min_age', required: false, type: Number, description: '16 a 45.' }),
    ApiQuery({ name: 'max_age', required: false, type: Number, description: '16 a 45.' }),
    ApiQuery({
      name: 'min_value',
      required: false,
      type: Number,
      description: 'Valor de mercado, de 0 a 550, até duas casas.',
    }),
    ApiQuery({
      name: 'max_value',
      required: false,
      type: Number,
      description: 'Valor de mercado, de 0 a 550, até duas casas.',
    }),
    ApiQuery({
      name: 'sort',
      required: false,
      type: String,
      description:
        'Até dois critérios separados por vírgula: name, value_asc, value_desc, age_asc, age_desc, position. Sem repetir o campo.',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, description: 'Padrão 1.' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: '1 a 50. Padrão 10.' }),
  );
}
