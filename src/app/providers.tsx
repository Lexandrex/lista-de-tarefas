import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthListener } from '@/lib/auth';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  useAuthListener();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
