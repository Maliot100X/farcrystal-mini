'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sdk, Context as MiniAppContext } from '@farcaster/miniapp-sdk';

interface MiniAppContextType {
  isReady: boolean;
  context: MiniAppContext | null;
  user: MiniAppContext['user'] | null;
  client: MiniAppContext['client'] | null;
  isMiniApp: boolean;
}

const MiniAppContext = createContext<MiniAppContextType>({
  isReady: false,
  context: null,
  user: null,
  client: null,
  isMiniApp: false,
});

export function useMiniApp() {
  return useContext(MiniAppContext);
}

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Check if running inside Farcaster Mini App
        const miniAppContext = await sdk.context;
        
        if (miniAppContext) {
          setIsMiniApp(true);
          setContext(miniAppContext);
          
          // Signal that the app is ready to display
          sdk.actions.ready();
        } else {
          setIsMiniApp(false);
        }
        
        setIsReady(true);
      } catch (error) {
        console.log('Not in Mini App context:', error);
        setIsMiniApp(false);
        setIsReady(true);
      }
    };

    initMiniApp();
  }, []);

  const value: MiniAppContextType = {
    isReady,
    context,
    user: context?.user || null,
    client: context?.client || null,
    isMiniApp,
  };

  return (
    <MiniAppContext.Provider value={value}>
      {children}
    </MiniAppContext.Provider>
  );
}
