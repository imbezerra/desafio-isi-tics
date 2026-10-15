import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

export function useAction<TInput, TResult>(
  action: (input: TInput) => Promise<TResult>,
  onSuccess: (result: TResult) => void | Promise<void>,
) {
  const locked = useRef(false);
  const mutation = useMutation({
    mutationFn: action,
    retry: false,
    onSuccess: (result) => onSuccess(result),
  });

  async function submit(input: TInput) {
    // O bloqueio síncrono cobre dois cliques antes de o React desabilitar o botão.
    if (locked.current) return;

    locked.current = true;

    try {
      await mutation.mutateAsync(input);
    } catch {
      // A mensagem fica em mutation.error; nenhum pedido de escrita é repetido automaticamente.
    } finally {
      locked.current = false;
    }
  }

  return { submit, pending: mutation.isPending, error: mutation.error?.message };
}
