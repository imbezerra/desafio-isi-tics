import { RespostaClube } from '../presenters/clube.presenter';
import { OrdenacaoClube } from '../dto/clube.dto';
import { compararNomes } from '../../common/formatters/text.formatter';

export function ordenarClubes(clubes: RespostaClube[], ordenacao: OrdenacaoClube): RespostaClube[] {
  return [...clubes].sort((esquerda, direita) => {
    const diferencaPatrimonio = esquerda.net_worth - direita.net_worth;
    if (ordenacao === 'net_worth_asc' && diferencaPatrimonio !== 0) return diferencaPatrimonio;
    if (ordenacao === 'net_worth_desc' && diferencaPatrimonio !== 0) return -diferencaPatrimonio;
    const diferencaNome = compararNomes(esquerda.name, direita.name);
    return diferencaNome || esquerda.id - direita.id;
  });
}
