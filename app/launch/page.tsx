'use client';

import { useState } from 'react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Rocket, 
  ArrowLeft, 
  Copy,
  CheckCircle,
  Terminal,
  Code,
  BookOpen,
  ExternalLink,
  Key,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export default function LaunchPage() {
  const { isMiniApp, user } = useMiniApp();
  const { address, isConnected } = useAccount();
  
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cli' | 'api' | 'skill'>('cli');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cliExample = `# 1. Get your API key from Farcrystal Mini App
# (Connect wallet → My Agent → Create Agent)

# 2. Install Bankr skill in your agent
skill install bankrbot/openclaw-skills/bankr

# 3. Set your API key
env set FARCRYSTAL_API_KEY=fc_agt_your_key_here

# 4. Launch a token!
farcrystal launch \\
  --name "MyToken" \\
  --symbol "MTK" \\
  --description "AI governance token" \\
  --supply 1000000 \\
  --image-url "https://..."`;

  const apiExample = `const FARCRYSTAL_API_KEY = process.env.FARCRYSTAL_API_KEY;

const response = await fetch('https://farcrystal.xyz/api/agents/launch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': FARCRYSTAL_API_KEY
  },
  body: JSON.stringify({
    name: 'MyToken',
    symbol: 'MTK',
    description: 'AI-powered token on Base',
    totalSupply: '1000000',
    imageUrl: 'https://...',
    social: {
      twitter: '@mytoken',
      telegram: 't.me/mytoken',
      farcaster: '@mytoken'
    }
  })
});

const result = await response.json();
console.log('Token deployed:', result.tokenAddress);`;

  const skillMdLink = 'https://farcrystal.xyz/skill.md';

  return (
    <div className="mini-app-frame">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 glass rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Launch Token</h1>
          <p className="text-sm text-white/60">Via OpenClaw / Bankr Skills</p>
        </div>
      </div>

      {/* Important Notice */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="farcrystal-card mb-6 border-yellow-500/30 bg-yellow-500/10"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-1">No Direct Launch Button</h3>
            <p className="text-sm text-white/80">
              Farcrystal uses <strong>OpenClaw skills</strong> for true agent autonomy. 
              You don't click a button - your <strong>AI agent launches programmatically</strong> 
              using your API key.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step 1: Get API Key */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="farcrystal-card mb-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
            1
          </div>
          <h3 className="font-semibold">Get Your API Key</h3>
        </div>

        {!isConnected ? (
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-white/70 mb-3">Connect your wallet first</p>
            <p className="text-sm text-white/50">
              Go to "My Agent" tab and create your agent to get an API key
            </p>
          </div>
        ) : (
          <div className="glass rounded-xl p-4">
            <p className="text-sm text-white/70 mb-3">
              Your API key is shown when you create an agent in the "My Agent" tab.
              It's displayed <strong>only once</strong> - save it securely!
            </p>
            <Link 
              href="/agent" 
              className="farcrystal-btn w-full text-sm"
            >
              <Key className="w-4 h-4" />
              Go to My Agent → Create Agent
            </Link>
          </div>
        )}
      </motion.div>

      {/* Step 2: Use Skills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="farcrystal-card mb-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
            2
          </div>
          <h3 className="font-semibold">Launch Via Skills</h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('cli')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'cli' 
                ? 'bg-purple-500 text-white' 
                : 'glass text-white/70'
            }`}
          >
            <Terminal className="w-4 h-4 inline mr-1" />
            CLI
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'api' 
                ? 'bg-purple-500 text-white' 
                : 'glass text-white/70'
            }`}
          >
            <Code className="w-4 h-4 inline mr-1" />
            API
          </button>
          <button
            onClick={() => setActiveTab('skill')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'skill' 
                ? 'bg-purple-500 text-white' 
                : 'glass text-white/70'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" />
            Skill.md
          </button>
        </div>

        {/* Content */}
        <div className="glass rounded-xl p-4">
          {activeTab === 'cli' && (
            <div>
              <p className="text-sm text-white/70 mb-3">
                Use OpenClaw CLI with Bankr skill:
              </p>
              <pre className="bg-black/50 rounded-lg p-3 text-xs text-green-400 overflow-x-auto font-mono">
                {cliExample}
              </pre>
              <button
                onClick={() => copyToClipboard(cliExample)}
                className="mt-3 flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy CLI example'}
              </button>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <p className="text-sm text-white/70 mb-3">
                Direct API integration in your agent code:
              </p>
              <pre className="bg-black/50 rounded-lg p-3 text-xs text-blue-400 overflow-x-auto font-mono">
                {apiExample}
              </pre>
              <button
                onClick={() => copyToClipboard(apiExample)}
                className="mt-3 flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy API example'}
              </button>
            </div>
          )}

          {activeTab === 'skill' && (
            <div>
              <p className="text-sm text-white/70 mb-3">
                Full skill documentation for AI agents:
              </p>
              <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">skill.md</span>
                </div>
                <p className="text-xs text-white/60 mb-3">
                  Complete API reference, examples, and integration guides for 
                  OpenClaude, Claude Code, and custom agents.
                </p>
                <a
                  href={skillMdLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="farcrystal-btn w-full text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View skill.md
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Step 3: Fee Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="farcrystal-card"
      >
        <h3 className="font-semibold mb-3">Fee Structure</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="glass rounded-lg p-3">
            <div className="text-lg font-bold text-purple-400">70%</div>
            <div className="text-xs text-white/60">Creator</div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="text-lg font-bold text-blue-400">25%</div>
            <div className="text-xs text-white/60">Platform</div>
          </div>
          <div className="glass rounded-lg p-3">
            <div className="text-lg font-bold text-green-400">5%</div>
            <div className="text-xs text-white/60">Partner</div>
          </div>
        </div>
        <p className="text-xs text-white/50 mt-3 text-center">
          Launch fee: 0.01 ETH • Trading fees: 0.3%
        </p>
      </motion.div>
    </div>
  );
}
