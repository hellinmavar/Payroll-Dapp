"use client";

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <InMemoryStorageProvider>
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
          {children}
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </InMemoryStorageProvider>
  );
}

