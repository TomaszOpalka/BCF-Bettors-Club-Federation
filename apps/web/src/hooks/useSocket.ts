import { useEffect } from 'react';
import { socket } from '@/lib/socketClient';
import { useBingoStore } from '@/stores/bingoStore';
import { useRouletteStore } from '@/stores/rouletteStore';

/**
 * Jedyne miejsce, gdzie eventy socket.io lądują w store'ach.
 * Wywoływane raz, w `App` - strony czytają już tylko store.
 */
export function useSocket(): void {
  useEffect(() => {
    const roulette = useRouletteStore.getState();
    const bingo = useBingoStore.getState();

    const onConnect = () => roulette.setConnected(true);
    const onDisconnect = () => roulette.setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('roulette:state', useRouletteStore.getState().applySnapshot);
    socket.on('roulette:spin-started', useRouletteStore.getState().startRound);
    socket.on('roulette:result', useRouletteStore.getState().finishRound);
    socket.on('roulette:error', ({ message }) => useRouletteStore.getState().setError(message));
    socket.on('bingo:state', bingo.setBoard);
    socket.on('bingo:updated', bingo.setBoard);
    socket.on('bingo:cell-toggled', bingo.applyToggle);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('roulette:state');
      socket.off('roulette:spin-started');
      socket.off('roulette:result');
      socket.off('roulette:error');
      socket.off('bingo:state');
      socket.off('bingo:updated');
      socket.off('bingo:cell-toggled');
      socket.disconnect();
    };
  }, []);
}

export function requestSpin(): void {
  socket.emit('roulette:spin');
}

export function toggleBingoCell(index: number): void {
  socket.emit('bingo:cell-toggle', { index });
}
