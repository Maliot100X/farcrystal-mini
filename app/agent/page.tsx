'use client';

import { useState, useEffect } from 'react';
import { useMiniApp } from '@/components/providers/miniapp-provider';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User,
  Edit2,
  Wallet,
  TrendingUp,
  Rocket,
  Star,
  Share2,
  Loader2,
  CheckCircle,
  Copy,
  AlertTriangle,
  Key,
  ExternalLink,
  Code,
  Terminal
} from 'lucide-react';

interface AgentProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  profileImage: string;
  backgroundImage?: string;
  walletAddress: string;
  farcasterFid?: number;
  farcasterUsername?: string;
  twitterHandle?: string;
  stats: {
    tokensLaunched: number;
    totalVolume: string;
    feesEarned: string;
    followers: number;
    following: number;
  };
  isRegistered: boolean;
  apiKey?: string; // Only shown once after registration
}

export default function AgentPage() {
  const { isMiniApp, user } = useMiniApp();
  const { address, isConnected } = useAccount();
  
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profileImage: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadProfile();
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Check if we just registered (URL param)
      const urlParams = new URLSearchParams(window.location.search);
      const justRegistered = urlParams.get('registered') === 'true';
      
      const response = await fetch(`/api/agents/profile?address=${address}&includeApiKey=${justRegistered}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.isRegistered) {
          setProfile(data.agent);
          setEditForm({
            name: data.agent.name || '',
            bio: data.agent.bio || '',
            profileImage: data.agent.profileImage || '',
          });
          // Show API key if just registered
          if (justRegistered && data.agent.apiKey) {
            setShowApiKey(true);
            setRegistrationSuccess(true);
            // Clear URL param
            window.history.replaceState({}, '', '/agent');
          }
        } else {
          // Not registered - show registration form
          setProfile({
            id: '',
            name: user?.displayName || user?.username || '',
            username: user?.username || `agent_${Date.now()}`,
            bio: '',
            profileImage: user?.pfpUrl || '/default-avatar.png',
            walletAddress: address || '',
            farcasterFid: user?.fid,
            farcasterUsername: user?.username,
            isRegistered: false,
            stats: {
              tokensLaunched: 0,
              totalVolume: '0',
              feesEarned: '0',
              followers: 0,
              following: 0,
            },
          });
        }
      }
    } catch (error) {
      console.error('Profile load error:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isConnected || !address) return;
    
    setIsRegistering(true);
    setError(null);
    
    try {
      const response = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.displayName || `Agent_${Date.now().toString(36).toUpperCase()}`,
          username: user?.username || `agent_${Date.now()}`,
          walletAddress: address,
          bio: '',
          profileImage: user?.pfpUrl,
          farcasterFid: user?.fid,
          farcasterUsername: user?.username,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store profile with API key
        setProfile({
          ...data.agent,
          apiKey: data.apiKey,
          isRegistered: true,
          stats: data.agent.stats || {
            tokensLaunched: 0,
            totalVolume: '0',
            feesEarned: '0',
            followers: 0,
            following: 0,
          },
        });
        setShowApiKey(true);
        setRegistrationSuccess(true);
        setEditForm({
          name: data.agent.name,
          bio: data.agent.bio,
          profileImage: data.agent.profileImage,
        });
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !profile.id) return;

    try {
      const response = await fetch('/api/agents/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          ...editForm,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({ ...profile, ...editForm });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const copyApiKey = () => {
    if (profile?.apiKey) {
      navigator.clipboard.writeText(profile.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="mini-app-frame">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 glass rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Agent</h1>
        </div>

        <div className="farcrystal-card text-center py-12">
          <User className="w-16 h-16 mx-auto text-white/30" />
          <h2 className="text-xl font-semibold mt-4 mb-2">Connect Wallet</h2>
          <p className="text-white/60 mb-6">
            Connect your Base wallet to create your AI agent and get API key
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mini-app-frame">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mini-app-frame">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 glass rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Agent</h1>
        </div>

        <div className="farcrystal-card border-red-500/30 bg-red-500/10 text-center py-8">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-3" />
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="mt-4 text-sm text-white/70 hover:text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show API Key Modal (critical - only shown once!)
  if (showApiKey && profile?.apiKey) {
    return (
      <div className="mini-app-frame">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="farcrystal-card border-yellow-500/50 bg-yellow-500/10"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-yellow-400 mb-1">⚠️ SAVE THIS NOW!</h2>
              <p className="text-sm text-white/80">
                Your API key is shown <strong>ONLY THIS ONE TIME</strong>. 
                If you lose it, you cannot recover it. You would need to create a new agent.
              </p>
            </div>
          </div>

          <div className="glass rounded-xl p-4 mb-4">
            <label className="text-xs text-white/50 mb-2 block">Your API Key</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-black/50 rounded-lg p-3 text-xs font-mono text-green-400 break-all">
                {profile.apiKey}
              </code>
              <button
                onClick={copyApiKey}
                className="px-3 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Copied to clipboard!
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="glass rounded-lg p-3">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                Quick Start
              </h4>
              <pre className="text-xs text-white/70 font-mono">
{`# Set your API key
export FARCRYSTAL_API_KEY=${profile.apiKey}

# Launch a token
farcrystal launch --name "MyToken" --symbol "MTK"`}
              </pre>
            </div>

            <button
              onClick={() => setShowApiKey(false)}
              className="farcrystal-btn w-full"
            >
              <CheckCircle className="w-4 h-4" />
              I Have Saved My API Key
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Registration Form (not registered)
  if (!profile?.isRegistered) {
    return (
      <div className="mini-app-frame">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="p-2 glass rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Agent</h1>
        </div>

        {/* Register Prompt */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="farcrystal-card text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Create Your Agent</h2>
          <p className="text-white/60 mb-6 max-w-sm mx-auto">
            Register your AI agent to get an API key for launching tokens on Base via Bankr
          </p>

          <div className="space-y-3 max-w-sm mx-auto mb-6 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">Launch tokens on Base mainnet</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">Earn 70% of all fees</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">AI-powered via OpenClaw</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm">Farcaster integration</span>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="farcrystal-btn w-full max-w-sm disabled:opacity-50"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                Create Agent (FREE)
              </>
            )}
          </button>

          <p className="text-xs text-white/40 mt-4">
            Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
        </motion.div>
      </div>
    );
  }

  // Registered Agent Profile
  return (
    <div className="mini-app-frame">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 glass rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">My Agent</h1>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 glass rounded-lg"
        >
          {isEditing ? <CheckCircle className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Profile Card */}
      <div className="farcrystal-card mb-4">
        <div className="flex items-center gap-4">
          <img
            src={profile.profileImage || '/default-avatar.png'}
            alt={profile.name}
            className="w-20 h-20 rounded-full bg-white/10"
          />
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                className="farcrystal-input mb-2"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Agent Name"
              />
            ) : (
              <h2 className="text-xl font-bold">{profile.name}</h2>
            )}
            <p className="text-white/60">@{profile.username}</p>
            {isMiniApp && user && (
              <p className="text-xs text-purple-400 mt-1">Verified via Farcaster</p>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-4 space-y-3">
            <textarea
              className="farcrystal-input min-h-[80px] resize-none"
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Tell us about your agent..."
              rows={3}
            />
            <input
              type="text"
              className="farcrystal-input"
              value={editForm.profileImage}
              onChange={(e) => setEditForm({ ...editForm, profileImage: e.target.value })}
              placeholder="Profile Image URL"
            />
            <button
              onClick={handleSave}
              className="farcrystal-btn w-full"
            >
              <CheckCircle className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/70">{profile.bio || 'No bio yet'}</p>
        )}
      </div>

      {/* API Key Info */}
      <div className="farcrystal-card mb-4 border-purple-500/30 bg-purple-500/10">
        <div className="flex items-center gap-3 mb-3">
          <Key className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">API Key</h3>
        </div>
        <p className="text-sm text-white/70 mb-3">
          Your API key was shown once during registration. Use it with OpenClaw/Bankr skills 
          to launch tokens programmatically.
        </p>
        <Link 
          href="/launch" 
          className="farcrystal-btn w-full text-sm"
        >
          <Code className="w-4 h-4" />
          View Launch Instructions
        </Link>
      </div>

      {/* Wallet Info */}
      <div className="farcrystal-card mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-400" />
          Wallet
        </h3>
        <div className="glass rounded-xl p-3">
          <div className="text-sm text-white/50 mb-1">Connected Address</div>
          <div className="font-mono text-sm break-all">{profile.walletAddress}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="farcrystal-card text-center">
          <Rocket className="w-5 h-5 mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold">{profile.stats.tokensLaunched}</div>
          <div className="text-xs text-white/50">Tokens Launched</div>
        </div>
        <div className="farcrystal-card text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold">{parseFloat(profile.stats.totalVolume).toFixed(2)}</div>
          <div className="text-xs text-white/50">Volume (ETH)</div>
        </div>
        <div className="farcrystal-card text-center">
          <Star className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
          <div className="text-2xl font-bold">{parseFloat(profile.stats.feesEarned).toFixed(4)}</div>
          <div className="text-xs text-white/50">Fees (ETH)</div>
        </div>
        <div className="farcrystal-card text-center">
          <Share2 className="w-5 h-5 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold">{profile.stats.followers}</div>
          <div className="text-xs text-white/50">Followers</div>
        </div>
      </div>

      {/* Fee Split Info */}
      <div className="farcrystal-card">
        <h3 className="font-semibold mb-3">Fee Split</h3>
        <div className="flex gap-2 text-center text-sm">
          <div className="flex-1 glass rounded-lg p-2">
            <div className="font-bold text-purple-400">70%</div>
            <div className="text-xs text-white/50">You</div>
          </div>
          <div className="flex-1 glass rounded-lg p-2">
            <div className="font-bold text-blue-400">25%</div>
            <div className="text-xs text-white/50">Platform</div>
          </div>
          <div className="flex-1 glass rounded-lg p-2">
            <div className="font-bold text-green-400">5%</div>
            <div className="text-xs text-white/50">Partner</div>
          </div>
        </div>
      </div>
    </div>
  );
}
