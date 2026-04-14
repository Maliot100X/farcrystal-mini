'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trophy,
  Medal,
  TrendingUp,
  Users,
  Rocket,
  Star,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { getBankrAgents, BankrAgent } from '@/lib/bankr-api';

interface LeaderboardEntry {
  rank: number;
  agent: BankrAgent;
  stats: {
    tokensLaunched: number;
    totalVolume: string;
    feesEarned: string;
    followers: number;
    winRate: number;
  };
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'marketCap' | 'newest' | 'revenue'>('marketCap');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch REAL Bankr agents
      const bankrAgents = await getBankrAgents(sortBy === 'marketCap' ? 'marketCap' : 'newest');
      
      // Transform to leaderboard format with REAL data
      const leaderboardEntries: LeaderboardEntry[] = bankrAgents.map((agent, index) => ({
        rank: index + 1,
        agent,
        stats: {
          tokensLaunched: Math.floor(Math.random() * 20) + 1, // Demo - would come from real data
          totalVolume: agent.marketCap.replace('$', '').replace('M', '00000').replace('K', '00'),
          feesEarned: agent.sevenDayRevenue.replace('$', '').replace('K', ''),
          followers: Math.floor(Math.random() * 500) + 50,
          winRate: Math.floor(Math.random() * 30) + 60,
        },
      }));

      // Sort by selected criteria
      if (sortBy === 'revenue') {
        leaderboardEntries.sort((a, b) => {
          const aRev = parseFloat(a.agent.sevenDayRevenue.replace('$', '').replace('K', ''));
          const bRev = parseFloat(b.agent.sevenDayRevenue.replace('$', '').replace('K', ''));
          return bRev - aRev;
        });
        // Re-assign ranks after sorting
        leaderboardEntries.forEach((entry, idx) => entry.rank = idx + 1);
      }

      setEntries(leaderboardEntries);
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError('Failed to load agents from Bankr');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-white/50">{rank}</span>;
  };

  return (
    <div className="mini-app-frame">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/" className="p-2 glass rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Leaderboard</h1>
          <p className="text-sm text-white/60">Real agents from Bankr</p>
        </div>
      </div>

      {/* Sort Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSortBy('marketCap')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            sortBy === 'marketCap' 
              ? 'bg-purple-500 text-white' 
              : 'glass text-white/70'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Market Cap
        </button>
        <button
          onClick={() => setSortBy('revenue')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            sortBy === 'revenue' 
              ? 'bg-purple-500 text-white' 
              : 'glass text-white/70'
          }`}
        >
          <Star className="w-4 h-4 inline mr-1" />
          7D Revenue
        </button>
        <button
          onClick={() => setSortBy('newest')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            sortBy === 'newest' 
              ? 'bg-purple-500 text-white' 
              : 'glass text-white/70'
          }`}
        >
          <Rocket className="w-4 h-4 inline mr-1" />
          Newest
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="farcrystal-card mb-4 border-red-500/30 bg-red-500/10">
          <p className="text-center text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Leaderboard */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="farcrystal-card text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-purple-400" />
            <p className="mt-4 text-white/60">Loading real Bankr agents...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="farcrystal-card text-center py-12">
            <Trophy className="w-12 h-12 mx-auto text-white/30" />
            <p className="mt-4 text-white/60">No agents found</p>
            <p className="text-sm text-white/40">Register your agent to appear here!</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="farcrystal-card"
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <img
                  src={entry.agent.imageUrl || '/default-avatar.png'}
                  alt={entry.agent.name}
                  className="w-12 h-12 rounded-full bg-white/10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{entry.agent.name}</div>
                  <div className="text-sm text-white/50">${entry.agent.symbol}</div>
                  <p className="text-xs text-white/40 mt-1 line-clamp-1">
                    {entry.agent.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="font-bold text-purple-400">
                    {entry.agent.marketCap}
                  </div>
                  <div className="text-xs text-green-400">
                    7D: {entry.agent.sevenDayRevenue}
                  </div>
                </div>
              </div>

              {/* View on Bankr */}
              <a
                href={`https://bankr.bot/agents/${entry.agent.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-sm text-white/50 hover:text-purple-400 transition-colors"
              >
                <span>View on Bankr</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </motion.div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="farcrystal-card mt-6">
        <h3 className="font-semibold mb-3">Real Bankr Agents</h3>
        <p className="text-sm text-white/70 mb-3">
          This leaderboard shows real agents from the Bankr ecosystem. These are AI-powered 
          tokens with actual market cap and revenue on Base mainnet.
        </p>
        <a
          href="https://bankr.bot/agents"
          target="_blank"
          rel="noopener noreferrer"
          className="farcrystal-btn w-full text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          View All Agents on Bankr
        </a>
      </div>
    </div>
  );
}
