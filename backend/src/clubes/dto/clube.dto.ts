export type CadastroClube = { name: string; acronym: string };

export const ORDENACOES_CLUBE = ['name', 'net_worth_asc', 'net_worth_desc'] as const;
export type OrdenacaoClube = (typeof ORDENACOES_CLUBE)[number];
