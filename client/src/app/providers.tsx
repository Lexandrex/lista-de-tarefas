import { useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { Toaster, toast } from "react-hot-toast";

type Props = { children: ReactNode };

function notifyError(message: string) {
  console.error(message);
  toast.error(message);
}

export default function AppProviders({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query?.state?.data !== undefined) return;
            notifyError(error instanceof Error ? error.message : String(error));
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            notifyError(error instanceof Error ? error.message : String(error));
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
