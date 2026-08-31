import { AppLayout } from '@/components/Layout/AppLayout';
import { useSocket } from '@/hooks/useSocket';

/** Korzeń aplikacji: podpina socket.io raz i renderuje layout z routingiem. */
export function App() {
  useSocket();
  return <AppLayout />;
}
