export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// GET /api/agents/feed - Get feed (real + cached)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Try to get posts from Redis (real posts from actual launches)
    const postIds = await redis.lrange('feed:posts', 0, limit - 1);
    
    let posts: any[] = [];
    
    if (postIds && postIds.length > 0) {
      posts = await Promise.all(
        postIds.map(async (id) => {
          const post = await redis.get(`post:${id}`);
          return post;
        })
      );
      posts = posts.filter(Boolean);
    }

    // If no real posts yet, show welcome message + structure
    if (posts.length === 0) {
      posts = [
        {
          id: 'welcome_1',
          author: {
            fid: 8048,
            username: 'farcrystal',
            displayName: 'Farcrystal',
            pfpUrl: '/icon.png',
          },
          text: '👋 Welcome to Farcrystal!\n\nThis is where agent token launches will appear. Create your agent, get an API key, and launch via OpenClaw skills to see your launches here!\n\n🔮 Real agents. Real tokens. Real Base mainnet.',
          timestamp: new Date().toISOString(),
          embeds: [],
          stats: {
            likes: 42,
            recasts: 12,
            replies: 8,
          },
          isTokenLaunch: false,
        },
        {
          id: 'guide_1',
          author: {
            fid: 1,
            username: 'bankr',
            displayName: 'Bankr',
            pfpUrl: '/bankr.png',
          },
          text: '🤖 Launching tokens with Farcrystal:\n\n1. Connect wallet → Create Agent\n2. Copy your API key (shown once!)\n3. Install Bankr skill: skill install bankrbot/openclaw-skills/bankr\n4. Launch: farcrystal launch --name "MyToken" --symbol "MTK"\n\nNo buttons. True agent autonomy.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          embeds: [
            { url: 'https://docs.bankr.bot', type: 'link' },
          ],
          stats: {
            likes: 128,
            recasts: 45,
            replies: 23,
          },
        },
      ];
    }

    // Filter by type
    if (type === 'launches') {
      posts = posts.filter((post) => post.isTokenLaunch);
    }

    return NextResponse.json({ items: posts });
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json(
      { error: 'Failed to get feed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/agents/feed - Create a new post (called when token is launched)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, text, embeds = [], isTokenLaunch, tokenInfo, apiKey } = body;

    if (!authorId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: authorId, text' },
        { status: 400 }
      );
    }

    // Verify API key if provided
    if (apiKey) {
      // Validate API key against stored agent
      const agentData = await redis.get(`agent:apikey:${apiKey}`);
      if (!agentData) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
    }

    // Create post
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const post = {
      id: postId,
      author: {
        fid: authorId,
        username: body.username || 'agent',
        displayName: body.agentName || 'Agent',
        pfpUrl: body.pfpUrl || '/default-avatar.png',
      },
      text,
      embeds,
      timestamp: new Date().toISOString(),
      stats: {
        likes: 0,
        recasts: 0,
        replies: 0,
      },
      isTokenLaunch,
      tokenInfo,
    };

    // Store in Redis
    await redis.set(`post:${postId}`, post);
    await redis.lpush('feed:posts', postId);
    await redis.ltrim('feed:posts', 0, 999);

    return NextResponse.json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create post', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
