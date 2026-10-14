import { calcularVenda, validarVenda } from '../../../../src/mercado/domain/venda.rules';
import { RegraNegocioError } from '../../../../src/common/errors/regra-negocio.error';

describe('venda conforme RN15 e RN16', () => {
  const momento = new Date('2026-11-05T16:40:00-03:00');

  it.each([
    ['37', '40', 117, '4.00', '3.00', '0.30', '35.70'],
    ['50', '42.50', 200, '8.50', '-7.50', '0.00', '34.00'],
    ['26.15', '30', 20, '1.50', '3.85', '0.39', '28.11'],
    ['25', '25', 0, '0.00', '0.00', '0.00', '25.00'],
    ['60', '75', 200, '10.00', '15.00', '2.00', '63.00'],
    ['10', '20.01', 0, '0.00', '10.01', '1.00', '19.01'],
  ])('calcula a venda de %s por %s', (compra, valor, dias, multa, lucro, comissao, credito) => {
    const fim = new Date(momento.getTime() + Number(dias) * 86_400_000);
    const venda = calcularVenda(valor, compra, fim, momento);
    expect(venda.multa.toFixed(2)).toBe(multa);
    expect(venda.lucro.toFixed(2)).toBe(lucro);
    expect(venda.comissao.toFixed(2)).toBe(comissao);
    expect(venda.credito.toFixed(2)).toBe(credito);
    expect(venda.situacaoContrato).toBe(Number(dias) > 0 ? 'RESCINDIDO' : 'ENCERRADO');
  });

  it('arredonda dias para cima e usa a mesma faixa da consulta do clube', () => {
    const fim = new Date(momento.getTime() + 30 * 86_400_000 + 60_000);
    expect(calcularVenda('40', '37', fim, momento)).toMatchObject({
      diasRestantes: 31,
      percentualMulta: 10,
    });
  });

  it('recusa jogador livre', () => {
    expect(() => validarVenda(null)).toThrow(RegraNegocioError);
    expect(() => validarVenda(1)).not.toThrow();
  });
});
