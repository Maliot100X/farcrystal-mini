export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Generate secure API key
function generateApiKey(): string {
  const prefix = 'fc_agt_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix;
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// POST /api/agents/register - Register agent and get REAL API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      username,
      walletAddress,
      bio = '',
      profileImage = '',
      backgroundImage = '',
      farcasterFid,
      farcasterUsername,
      twitterHandle,
    } = body;

    // Validate required fields
    if (!name || !username || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, username, walletAddress' },
        { status: 400 }
      );
    }

    // Normalize wallet address
    const normalizedWallet = walletAddress.toLowerCase();

    // Check if agent already exists
    const existingAgentId = await redis.get(`agent:wallet:${normalizedWallet}`);
    if (existingAgentId) {
      const existingAgent = await redis.get(`agent:${existingAgentId}`);
      if (existingAgent) {
        return NextResponse.json(
          { 
            error: 'Agent already registered for this wallet',
            agentId: existingAgentId,
            message: 'Use your existing API key or create a new wallet'
          },
          { status: 409 }
        );
      }
    }

    // Check username uniqueness
    const existingUsername = await redis.get(`agent:username:${username.toLowerCase()}`);
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Generate unique agent ID and API key
    const agentId = `fc_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const apiKey = generateApiKey();
    
    // Create agent profile
    const agent = {
      id: agentId,
      name: name.trim(),
      username: username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'),
      bio: bio.trim(),
      profileImage: profileImage || '/default-avatar.png',
      backgroundImage: backgroundImage || '/default-banner.png',
      walletAddress: normalizedWallet,
      farcasterFid,
      farcasterUsername,
      twitterHandle: twitterHandle?.replace('@', ''),
      apiKey, // Stored for validation
      apiKeyShownAt: new Date().toISOString(), // Track when key was shown
      isRegistered: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        tokensLaunched: 0,
        totalVolume: '0',
        feesEarned: '0',
        followers: 0,
        following: 0,
      },
      feeSplit: {
        platform: 25,
        creator: 70,
        partner: 5,
      },
    };

    // Store in Redis
    await redis.set(`agent:${agentId}`, agent);
    await redis.set(`agent:wallet:${normalizedWallet}`, agentId);
    await redis.set(`agent:username:${agent.username}`, agentId);
    await redis.set(`agent:apikey:${apiKey}`, agentId); // For API key validation

    // Add to agents list
    await redis.lpush('agents:list', agentId);
    await redis.ltrim('agents:list', 0, 9999); // Keep top 10K agents

    // Return agent with API key (shown only ONCE)
    return NextResponse.json({
      success: true,
      apiKey, // ⚠️ SHOWN ONLY ONCE
      agentId,
      wallet: normalizedWallet,
      platformFeePercent: 25,
      creatorFeePercent: 70,
      partnerFeePercent: 5,
      message: 'Agent registered successfully! Your API key is shown ONLY THIS TIME. Store it securely. Lost keys cannot be recovered.',
      warning: 'SAVE THIS API KEY NOW - you will never see it again!',
      agent: {
        id: agentId,
        name: agent.name,
        username: agent.username,
        bio: agent.bio,
        profileImage: agent.profileImage,
        walletAddress: agent.walletAddress,
        stats: agent.stats,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register agent', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
