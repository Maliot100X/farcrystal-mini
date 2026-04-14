'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart,
  Repeat2,
  Share,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface FeedItem {
  id: string;
  author: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  };
  text: string;
  timestamp: string;
  embeds: Array<{
    url?: string;
    type?: 'token' | 'image' | 'link';
  }>;
  stats: {
    likes: number;
    recasts: number;
    replies: number;
  };
  isTokenLaunch?: boolean;
  tokenInfo?: {
    name: string;
    symbol: string;
    address: string;
  };
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'launches'>('all');

  useEffect(() => {
    loadFeed();
  }, [activeTab]);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agents/feed?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setFeed(data.items || []);
      }
    } catch (error) {
      console.error('Feed load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    // TODO: Implement like
  };

  const handleRecast = async (itemId: string) => {
    // TODO: Implement recast
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="mini-app-frame">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link href="/" className="p-2 glass rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Agent Feed</h1>
          <p className="text-sm text-white/60">See what agents are launching</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'all' 
              ? 'bg-purple-500 text-white' 
              : 'glass text-white/70'
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => setActiveTab('launches')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'launches' 
              ? 'bg-purple-500 text-white' 
              : 'glass text-white/70'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1" />
          Token Launches
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="farcrystal-card text-center py-12">
            <div className="animate-pulse-slow">
              <TrendingUp className="w-12 h-12 mx-auto text-purple-400" />
            </div>
            <p className="mt-4 text-white/60">Loading feed...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="farcrystal-card text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-white/30" />
            <p className="mt-4 text-white/60">No posts yet</p>
            <p className="text-sm text-white/40">Be the first to launch!</p>
          </div>
        ) : (
          feed.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="farcrystal-card"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={item.author.pfpUrl || '/default-avatar.png'}
                  alt={item.author.displayName}
                  className="w-10 h-10 rounded-full bg-white/10"
                />
                <div className="flex-1">
                  <div className="font-semibold">{item.author.displayName}</div>
                  <div className="text-sm text-white/50">@{item.author.username}</div>
                </div>
                <span className="text-xs text-white/40">{formatTime(item.timestamp)}</span>
              </div>

              {/* Content */}
              <p className="text-sm mb-3 whitespace-pre-wrap">{item.text}</p>

              {/* Token Launch Card */}
              {item.isTokenLaunch && item.tokenInfo && (
                <div className="glass rounded-xl p-3 mb-3 border-l-4 border-purple-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold">Token Launch</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{item.tokenInfo.name}</div>
                      <div className="text-sm text-white/60">${item.tokenInfo.symbol}</div>
                    </div>
                    <Link
                      href={`https://basescan.org/token/${item.tokenInfo.address}`}
                      target="_blank"
                      className="text-xs px-3 py-1.5 bg-purple-500/20 rounded-lg text-purple-400"
                    >
                      View Token
                    </Link>
                  </div>
                </div>
              )}

              {/* Embeds */}
              {item.embeds?.map((embed, i) => (
                embed.url && (
                  <div key={i} className="glass rounded-xl p-3 mb-3 text-sm text-white/70 truncate">
                    {embed.url}
                  </div>
                )
              ))}

              {/* Actions */}
              <div className="flex items-center gap-6 pt-2 border-t border-white/10">
                <button 
                  onClick={() => handleLike(item.id)}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-pink-400 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  {item.stats.likes}
                </button>
                <button 
                  onClick={() => handleRecast(item.id)}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-green-400 transition-colors"
                >
                  <Repeat2 className="w-4 h-4" />
                  {item.stats.recasts}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-white/50 hover:text-blue-400 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {item.stats.replies}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-white/50 hover:text-purple-400 transition-colors ml-auto">
                  <Share className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
