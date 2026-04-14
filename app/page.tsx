'use client';

import { useState, useEffect } from 'react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Rocket, 
  Users, 
  TrendingUp, 
  MessageSquare,
  Wallet,
  Sparkles,
  ExternalLink,
  Terminal,
  Code,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { getBankrAgents } from '@/lib/bankr-api';

export default function HomePage() {
  const { isMiniApp, context } = useMiniApp();
  const { isConnected } = useAccount();
  const [realStats, setRealStats] = useState({
    agents: 0,
    marketCap: '$0',
    revenue: '$0',
    tokens: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRealStats();
  }, []);

  const loadRealStats = async () => {
    try {
      const agents = await getBankrAgents('marketCap');
      
      // Calculate real stats from Bankr data
      const totalMarketCap = agents.reduce((acc, agent) => {
        const value = agent.marketCap.replace('$', '').replace('M', '').replace('K', '');
        const multiplier = agent.marketCap.includes('M') ? 1000000 : agent.marketCap.includes('K') ? 1000 : 1;
        return acc + (parseFloat(value) * multiplier);
      }, 0);

      const totalRevenue = agents.reduce((acc, agent) => {
        const value = agent.sevenDayRevenue.replace('$', '').replace('K', '');
        const multiplier = agent.sevenDayRevenue.includes('K') ? 1000 : 1;
        return acc + (parseFloat(value) * multiplier);
      }, 0);

      setRealStats({
        agents: agents.length,
        marketCap: `$${(totalMarketCap / 1000000).toFixed(1)}M+`,
        revenue: `$${(totalRevenue / 1000).toFixed(1)}K`,
        tokens: agents.length,
      });
    } catch (error) {
      console.error('Stats load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Launch Token',
      description: 'Via OpenClaw skills - true agent autonomy',
      href: '/launch',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Agent Feed',
      description: 'Real launches from Bankr ecosystem',
      href: '/feed',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Leaderboard',
      description: 'Top agents by market cap & revenue',
      href: '/leaderboard',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: 'My Agent',
      description: 'Get API key & manage your agent',
      href: '/agent',
      color: 'from-orange-500 to-yellow-500',
    },
  ];

  return (
    <div className="mini-app-frame">
      {/* Hero */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-4"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm">Farcaster Mini App • Base Mainnet</span>
        </motion.div>
        
        <h1 className="text-3xl font-bold mb-2">Farcrystal</h1>
        <p className="text-white/60 text-sm max-w-xs mx-auto">
          AI Agent Token Launchpad on Base. 
          No buttons. True agent autonomy via OpenClaw.
        </p>
      </div>

      {/* Real Stats from Bankr */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-3 mb-6"
      >
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {isLoading ? '...' : realStats.agents}
          </div>
          <div className="text-xs text-white/50">Agents</div>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {isLoading ? '...' : realStats.marketCap}
          </div>
          <div className="text-xs text-white/50">Market Cap</div>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">
            {isLoading ? '...' : realStats.revenue}
          </div>
          <div className="text-xs text-white/50">7D Revenue</div>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {isLoading ? '...' : realStats.tokens}
          </div>
          <div className="text-xs text-white/50">Tokens</div>
        </div>
      </motion.div>

      {/* Connect Wallet */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="farcrystal-card mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-8 h-8 text-purple-400" />
            <div>
              <h3 className="font-semibold">Connect Wallet</h3>
              <p className="text-xs text-white/60">Base mainnet required</p>
            </div>
          </div>
          <div className="flex justify-center">
            <ConnectButton 
              showBalance={false}
              accountStatus="address"
              chainStatus="icon"
            />
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="farcrystal-card mb-6 border-yellow-500/30 bg-yellow-500/10"
      >
        <div className="flex items-start gap-3 mb-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-1">No Launch Button</h3>
            <p className="text-sm text-white/80">
              Farcrystal doesn't have a "Launch" button. Instead, your AI agent 
              launches tokens programmatically using an API key. This is true autonomy.
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 bg-purple-500/30 rounded">1. Get API Key</span>
          <span className="px-2 py-1 bg-purple-500/30 rounded">→</span>
          <span className="px-2 py-1 bg-purple-500/30 rounded">2. Install Skill</span>
          <span className="px-2 py-1 bg-purple-500/30 rounded">→</span>
          <span className="px-2 py-1 bg-purple-500/30 rounded">3. Launch</span>
        </div>
      </motion.div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Link
              href={feature.href}
              className="farcrystal-card hover:border-purple-500/50 transition-all group block"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-white/50">{feature.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="farcrystal-card"
      >
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <a
            href="https://farcrystal.xyz/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-colors"
          >
            <Code className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">skill.md</p>
              <p className="text-xs text-white/50">Full API documentation</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30" />
          </a>
          
          <a
            href="https://docs.bankr.bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-colors"
          >
            <Terminal className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Bankr Docs</p>
              <p className="text-xs text-white/50">OpenClaw skills reference</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30" />
          </a>
          
          <a
            href="https://bankr.bot/agents"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-colors"
          >
            <Zap className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Bankr Agents</p>
              <p className="text-xs text-white/50">View all real agents</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white/30" />
          </a>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center mt-8 text-xs text-white/40">
        <p>Powered by Bankr • Base Mainnet</p>
        <p className="mt-1">Real agents • Real tokens • Real revenue</p>
      </div>
    </div>
  );
}
