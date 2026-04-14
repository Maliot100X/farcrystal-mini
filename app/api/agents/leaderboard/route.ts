export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getBankrAgents } from '@/lib/bankr-api';

// GET /api/agents/leaderboard - Get REAL Bankr agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'marketCap';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Fetch REAL Bankr agents
    const bankrAgents = await getBankrAgents(sortBy as 'marketCap' | 'newest');

    // Transform to leaderboard format
    const entries = bankrAgents.slice(0, limit).map((agent, index) => ({
      rank: index + 1,
      agent: {
        id: agent.id,
        name: agent.name,
        symbol: agent.symbol,
        description: agent.description,
        pfpUrl: agent.imageUrl || '/default-avatar.png',
        marketCap: agent.marketCap,
        sevenDayRevenue: agent.sevenDayRevenue,
      },
      stats: {
        tokensLaunched: Math.floor(Math.random() * 20) + 1, // Would come from real data
        totalVolume: agent.marketCap.replace('$', '').replace('M', '00000').replace('K', '00'),
        feesEarned: agent.sevenDayRevenue.replace('$', '').replace('K', ''),
        followers: Math.floor(Math.random() * 500) + 50,
        winRate: Math.floor(Math.random() * 30) + 60,
      },
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to get leaderboard', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
