import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function documentHistoryQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'type',
      required: false,
      type: String,
      description: 'COMPRA, VENDA ou os dois separados por vírgula, sem espaços nem repetição.',
    }),
    ApiQuery({
      name: 'player_id',
      required: false,
      type: Number,
      description:
        'Id de jogador existente e não excluído. Sem histórico no clube, retorna lista vazia.',
    }),
  );
}
