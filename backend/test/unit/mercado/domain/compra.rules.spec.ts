import {
  calcularCompra,
  validarCompra,
  validarPrazoFidelidade,
} from '../../../../src/mercado/domain/compra.rules';
import { calcularFidelidade } from '../../../../src/mercado/domain/fidelidade.rules';
import { RegraNegocioError } from '../../../../src/common/errors/regra-negocio.error';
import { EntradaInvalidaError } from '../../../../src/common/errors/entrada-invalida.error';

describe('compra conforme RN12–RN14', () => {
  it.each([
    ['30', '0.00', '30.00'],
    ['30.01', '1.50', '31.51'],
    ['47.62', '2.38', '50.00'],
  ])('calcula taxa e custo para valor %s', (valor, taxa, custo) => {
    const resultado = calcularCompra(valor, '100');
    expect(resultado.taxa.toFixed(2)).toBe(taxa);
    expect(resultado.custo.toFixed(2)).toBe(custo);
  });

  it('compara contra metade não arredondada do caixa', () => {
    expect(() => calcularCompra('124.35', '261.15')).not.toThrow();
    expect(() => calcularCompra('124.36', '261.15')).toThrow(RegraNegocioError);
  });

  it('recusa jogador ocupado, recompra e décimo terceiro jogador', () => {
    expect(() => validarCompra(true, false, 0)).toThrow(RegraNegocioError);
    expect(() => validarCompra(false, true, 0)).toThrow(RegraNegocioError);
    expect(() => validarCompra(false, false, 12)).toThrow(RegraNegocioError);
    expect(() => validarCompra(false, false, 11)).not.toThrow();
  });

  it('aceita prazo futuro até 1.095 dias exatos', () => {
    const agora = new Date('2026-01-01T00:00:00Z');
    const maximo = new Date(agora.getTime() + 1095 * 86_400_000);
    expect(() => validarPrazoFidelidade(maximo, agora)).not.toThrow();
    expect(() => validarPrazoFidelidade(agora, agora)).toThrow(EntradaInvalidaError);
    expect(() => validarPrazoFidelidade(new Date(maximo.getTime() + 1), agora)).toThrow(
      EntradaInvalidaError,
    );
  });
});

describe('fidelidade conforme RN15', () => {
  const agora = new Date('2026-01-01T00:00:00Z');
  it.each([
    [0, 0, 0],
    [1, 1, 5],
    [30, 30, 5],
    [31, 31, 10],
    [180, 180, 10],
    [181, 181, 20],
  ])('para %i dias retorna %i dias e %i%%', (dias, esperados, percentual) => {
    expect(calcularFidelidade(new Date(agora.getTime() + dias * 86_400_000), agora)).toEqual({
      diasRestantes: esperados,
      percentualMulta: percentual,
    });
  });

  it('arredonda fração de dia para cima', () => {
    expect(calcularFidelidade(new Date(agora.getTime() + 30 * 86_400_000 + 1), agora)).toEqual({
      diasRestantes: 31,
      percentualMulta: 10,
    });
  });
});
