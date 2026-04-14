'use client';

import { ReactNode } from 'react';
import { MiniAppProvider } from './miniapp-provider';
import { WalletProvider } from './wallet-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MiniAppProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </MiniAppProvider>
  );
}
