import { apresentarJogador } from '../../jogadores/presenters/jogador.presenter';
import { decimal } from '../../common/calculations/money.calculator';
import { compararNomes } from '../../common/formatters/text.formatter';
import { formatarDataHoraBrasilia } from '../../common/parsers/date.parser';
import { ClubeComElenco } from '../repositories/clubes.repository';
import { calcularFidelidade } from '../../mercado/domain/fidelidade.rules';

export function apresentarClube(
  clube: ClubeComElenco,
  incluirElenco = false,
  momento = new Date(),
) {
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
        contract: apresentarContrato(clube, jogador.id, momento),
      }))
      .sort(compararJogadoresDoElenco),
  };
}

function apresentarContrato(clube: ClubeComElenco, jogadorId: number, momento: Date) {
  const contrato = clube.jogadores.find((jogador) => jogador.id === jogadorId)?.contratos[0];
  if (!contrato) return null;
  const fidelidade = calcularFidelidade(contrato.fidelidadeAte, momento);
  return {
    purchase_value: contrato.valorCompra.toNumber(),
    loyalty_until: formatarDataHoraBrasilia(contrato.fidelidadeAte),
    remaining_days: fidelidade.diasRestantes,
    penalty_rate: fidelidade.percentualMulta,
  };
}

function compararJogadoresDoElenco(
  esquerda: { position: string; name: string; id: number },
  direita: { position: string; name: string; id: number },
): number {
  const ordem = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];
  return (
    ordem.indexOf(esquerda.position) - ordem.indexOf(direita.position) ||
    compararNomes(esquerda.name, direita.name) ||
    esquerda.id - direita.id
  );
}

export type RespostaClube = ReturnType<typeof apresentarClube>;
