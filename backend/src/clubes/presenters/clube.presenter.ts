import { apresentarJogador } from '../../jogadores/presenters/jogador.presenter';
import { decimal } from '../../common/calculations/money.calculator';
import { ClubeComElenco } from '../repositories/clubes.repository';

export function apresentarClube(clube: ClubeComElenco, incluirElenco = false) {
  const jogadores = clube.jogadores.map(apresentarJogador);
  const valorElenco = jogadores.reduce(
    (soma, jogador) => soma.plus(jogador.market_value),
    decimal(0),
  );
  const patrimonio = decimal(clube.caixa.toString()).plus(valorElenco);
  const resposta = {
    id: clube.id,
    name: clube.nome,
    acronym: clube.sigla,
    cash: clube.caixa.toNumber(),
    squad_value: valorElenco.toNumber(),
    net_worth: patrimonio.toNumber(),
  };
  if (!incluirElenco) return resposta;

  return {
    ...resposta,
    players: jogadores
      .map((jogador) => ({
        ...jogador,
        contract: apresentarContrato(clube, jogador.id),
      }))
      .sort(compararJogadoresDoElenco),
  };
}

function apresentarContrato(clube: ClubeComElenco, jogadorId: number) {
  const contrato = clube.jogadores.find((jogador) => jogador.id === jogadorId)?.contratos[0];
  if (!contrato) return null;
  // O cálculo de fidelidade será centralizado no módulo de mercado (RN15).
  return { purchase_value: contrato.valorCompra.toNumber(), loyalty_until: contrato.fidelidadeAte };
}

function compararJogadoresDoElenco(
  esquerda: { position: string; name: string; id: number },
  direita: { position: string; name: string; id: number },
): number {
  const ordem = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];
  return (
    ordem.indexOf(esquerda.position) - ordem.indexOf(direita.position) ||
    esquerda.name.localeCompare(direita.name, 'pt-BR') ||
    esquerda.id - direita.id
  );
}

export type RespostaClube = ReturnType<typeof apresentarClube>;
