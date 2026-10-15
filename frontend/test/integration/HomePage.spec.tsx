import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../helpers/mock-api';
import { renderApp } from '../helpers/render-app';
import { playerList } from '../fixtures/league.fixture';

describe('Tela inicial e navegação sem recarga', () => {
  it('mostra os dados reais de uma liga vazia', async () => {
    mockApi(() => Response.json(playerList([])));
    renderApp();
    expect(await screen.findByText('Não precisa de login')).toBeInTheDocument();
    expect(screen.getByText('Sua liga começa aqui', { exact: false })).toBeInTheDocument();
    expect(screen.queryByText('Delta FC')).not.toBeInTheDocument();
  });
  it('navega pelo botão Iniciar para a listagem', async () => {
    mockApi();
    renderApp();
    await userEvent.click(screen.getByRole('link', { name: 'Iniciar' }));
    expect(await screen.findByRole('heading', { name: 'Jogadores' })).toBeInTheDocument();
  });
  it('navega pelo atalho Enter fora de campos interativos', async () => {
    mockApi();
    renderApp();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Jogadores' })).toBeInTheDocument();
  });
  it('trata caminhos inexistentes', () => {
    renderApp('/pagina-inexistente');
    expect(screen.getByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument();
  });
});
