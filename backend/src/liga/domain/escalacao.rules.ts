import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { Formacao, VAGAS_POR_FORMACAO } from './formacoes';

type JogadorEscalavel = { clubeId: number | null; posicao: string; condicao: string };

export function validarEscalacao(
  clubeId: number,
  formacao: Formacao,
  jogadores: JogadorEscalavel[],
): void {
  if (jogadores.some((jogador) => jogador.clubeId !== clubeId)) {
    throw new RegraNegocioError('Todos os titulares devem pertencer ao elenco do clube.');
  }
  if (jogadores.some((jogador) => jogador.condicao === 'DOENTE')) {
    throw new RegraNegocioError('Jogador DOENTE não pode ser escalado.');
  }
  const vagas = VAGAS_POR_FORMACAO[formacao];
  const goleiros = jogadores.filter((j) => j.posicao === 'GOL').length;
  const defesa = jogadores.filter((j) => j.posicao === 'ZAG' || j.posicao === 'LAT').length;
  const meio = jogadores.filter((j) => j.posicao === 'MEI').length;
  const ataque = jogadores.filter((j) => j.posicao === 'ATA').length;
  if (
    jogadores.length !== 5 ||
    goleiros !== 1 ||
    defesa !== vagas.defesa ||
    meio !== vagas.meio ||
    ataque !== vagas.ataque
  ) {
    throw new RegraNegocioError('As posições dos titulares não correspondem à formação escolhida.');
  }
}
