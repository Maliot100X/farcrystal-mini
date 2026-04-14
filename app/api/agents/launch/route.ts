export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const BANKR_API_BASE_URL = 'https://api.bankr.bot';

// POST /api/agents/launch - Launch token using Bankr Agent API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      apiKey,
      name, 
      symbol, 
      description = '', 
      totalSupply = '1000000',
      imageUrl = '',
      website = '',
      twitter = '',
      telegram = '',
      farcaster = '',
    } = body;

    // Validate required fields
    if (!apiKey || !name || !symbol) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, name, symbol' },
        { status: 400 }
      );
    }

    // Validate API key and get agent
    const agentId = await redis.get(`agent:apikey:${apiKey}`);
    if (!agentId) {
      return NextResponse.json(
        { error: 'Invalid API key. Register at /agent to get one.' },
        { status: 401 }
      );
    }

    const agent = await redis.get(`agent:${agentId}`) as any;
    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Call Bankr Agent API to launch token
    // Step 1: Submit prompt to Bankr
    const promptResponse = await fetch(`${BANKR_API_BASE_URL}/agent/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.BANKR_API_KEY || '',
      },
      body: JSON.stringify({
        message: `Launch token "${name}" with symbol $${symbol} on Base mainnet`,
        context: {
          action: 'token_launch',
          params: {
            name,
            symbol: symbol.toUpperCase(),
            description,
            totalSupply,
            imageUrl,
            website,
            twitter,
            telegram,
            farcaster,
            creatorWallet: agent.walletAddress,
            feeRecipient: agent.walletAddress,
            feePercentage: 2.5,
          }
        }
      }),
    });

    if (!promptResponse.ok) {
      const error = await promptResponse.text();
      return NextResponse.json(
        { error: 'Bankr API error', details: error },
        { status: 502 }
      );
    }

    const { jobId } = await promptResponse.json();

    // Step 2: Poll job status (max 10 attempts, 3 second delay)
    let jobResult = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const jobResponse = await fetch(`${BANKR_API_BASE_URL}/agent/job/${jobId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.BANKR_API_KEY || '',
        },
      });

      if (jobResponse.ok) {
        const job = await jobResponse.json();
        
        if (job.status === 'completed') {
          jobResult = job.result;
          break;
        }
        
        if (job.status === 'failed') {
          return NextResponse.json(
            { error: 'Token launch failed', details: job.error },
            { status: 500 }
          );
        }
      }
    }

    if (!jobResult) {
      return NextResponse.json(
        { 
          error: 'Launch timeout', 
          message: 'Job is still processing. Check status later.',
          jobId 
        },
        { status: 202 }
      );
    }

    // Update agent stats
    agent.stats = agent.stats || {};
    agent.stats.tokensLaunched = (agent.stats.tokensLaunched || 0) + 1;
    await redis.set(`agent:${agentId}`, agent);

    // Create feed post
    const postId = `post_${Date.now()}`;
    const post = {
      id: postId,
      author: {
        fid: agent.farcasterFid,
        username: agent.username,
        displayName: agent.name,
        pfpUrl: agent.profileImage,
      },
      text: `🚀 Just launched $${symbol}!\n\n${name} - ${description}\n\nContract: ${jobResult.tokenAddress || 'Pending'}`,
      timestamp: new Date().toISOString(),
      stats: { likes: 0, recasts: 0, replies: 0 },
      isTokenLaunch: true,
      tokenInfo: {
        name,
        symbol: symbol.toUpperCase(),
        address: jobResult.tokenAddress,
        explorerUrl: `https://basescan.org/token/${jobResult.tokenAddress}`,
      },
    };
    await redis.set(`post:${postId}`, post);
    await redis.lpush('feed:posts', postId);

    // Return success
    return NextResponse.json({
      success: true,
      tokenAddress: jobResult.tokenAddress,
      deployTxHash: jobResult.deployTxHash || jobResult.txHash,
      name,
      symbol: symbol.toUpperCase(),
      totalSupply,
      explorerUrl: `https://basescan.org/token/${jobResult.tokenAddress}`,
      jobId,
      status: 'deployed',
      message: `Token ${name} ($${symbol.toUpperCase()}) launched successfully!`,
    });

  } catch (error) {
    console.error('Launch error:', error);
    return NextResponse.json(
      { error: 'Failed to launch token', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
