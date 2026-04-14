export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// GET /api/agents/profile - Get agent profile by wallet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const agentId = searchParams.get('id');
    const includeApiKey = searchParams.get('includeApiKey') === 'true';

    if (!address && !agentId) {
      return NextResponse.json(
        { error: 'Missing address or id parameter' },
        { status: 400 }
      );
    }

    let agent: any = null;

    if (agentId) {
      agent = await redis.get(`agent:${agentId}`);
    } else if (address) {
      const foundId = await redis.get(`agent:wallet:${address.toLowerCase()}`);
      if (foundId) {
        agent = await redis.get(`agent:${foundId}`);
      }
    }

    if (!agent) {
      // Return not-registered response
      return NextResponse.json({
        isRegistered: false,
        message: 'No agent found for this wallet. Create one to get an API key.',
      });
    }

    // Don't return API key unless explicitly requested (and only once after registration)
    const response: any = {
      success: true,
      isRegistered: true,
      agent: {
        id: agent.id,
        name: agent.name,
        username: agent.username,
        bio: agent.bio,
        profileImage: agent.profileImage,
        backgroundImage: agent.backgroundImage,
        walletAddress: agent.walletAddress,
        farcasterFid: agent.farcasterFid,
        farcasterUsername: agent.farcasterUsername,
        twitterHandle: agent.twitterHandle,
        stats: agent.stats || {
          tokensLaunched: 0,
          totalVolume: '0',
          feesEarned: '0',
          followers: 0,
          following: 0,
        },
        createdAt: agent.createdAt,
      },
      feeSplit: agent.feeSplit || {
        platform: 25,
        creator: 70,
        partner: 5,
      },
    };

    // Only include API key if requested AND recently registered
    if (includeApiKey && agent.apiKey) {
      const createdAt = new Date(agent.createdAt);
      const now = new Date();
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      // Only show API key within 24 hours of registration
      if (hoursSinceCreation < 24) {
        response.agent.apiKey = agent.apiKey;
        response.warning = 'API key shown for security review only. Store it securely!';
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Profile get error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/agents/profile - Update agent profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, bio, profileImage, backgroundImage, farcasterFid, farcasterUsername, twitterHandle } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing agent id' },
        { status: 400 }
      );
    }

    const existingAgent = await redis.get(`agent:${id}`);
    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (backgroundImage !== undefined) updates.backgroundImage = backgroundImage;
    if (farcasterFid !== undefined) updates.farcasterFid = farcasterFid;
    if (farcasterUsername !== undefined) updates.farcasterUsername = farcasterUsername;
    if (twitterHandle !== undefined) updates.twitterHandle = twitterHandle?.replace('@', '');

    const updatedAgent = { ...(existingAgent as any), ...updates };
    await redis.set(`agent:${id}`, updatedAgent);

    // Don't return API key in update response
    const { apiKey, ...agentWithoutKey } = updatedAgent;

    return NextResponse.json({
      success: true,
      agent: agentWithoutKey,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
