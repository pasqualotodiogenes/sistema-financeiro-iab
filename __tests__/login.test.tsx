import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../app/page';

// Mock useRouter do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('LoginPage', () => {
  it('renderiza o formulário de login', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acesso como visitante/i })).toBeInTheDocument();
  });

  it('mostra mensagem de erro se login falhar', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Credenciais inválidas' }) });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/usuário/i), { target: { value: 'errado' } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'errado' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });

  it('faz login como visitante', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ user: { username: 'visitante' } }) });
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /acesso como visitante/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('visitante'),
        })
      );
    });
  });
}); 