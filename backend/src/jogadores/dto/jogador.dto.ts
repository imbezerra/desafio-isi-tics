import { AtributosJogador, Condicao, Posicao } from '../../common/domain.types';

export type EdicaoJogador = { name: string; position: Posicao; agility: number; age: number };
export type CadastroJogador = EdicaoJogador & AtributosJogador & { potential: number };

export const ORDENACOES_JOGADOR = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
] as const;
export type OrdenacaoJogador = (typeof ORDENACOES_JOGADOR)[number];

export type ConsultaJogadores = {
  search?: string;
  position?: Posicao;
  condition?: Condicao;
  free?: boolean;
  clubeId?: number;
  idadeMinima: number;
  idadeMaxima: number;
  valorMinimo: number;
  valorMaximo: number;
  sort: OrdenacaoJogador[];
  page: number;
  limit: number;
};
