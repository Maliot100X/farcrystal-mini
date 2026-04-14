export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { deployToken, shareTokenLaunch } from '@/lib/farcaster-api';

// POST /api/bankr/deploy - Deploy a new token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      symbol,
      description,
      totalSupply,
      imageUrl,
      twitter,
      telegram,
      website,
      farcaster,
      creatorAddress,
      farcasterFid,
      farcasterUsername,
    } = body;

    // Validate required fields
    if (!name || !symbol || !totalSupply || !creatorAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: name, symbol, totalSupply, creatorAddress' },
        { status: 400 }
      );
    }

    // Build social links
    const socialLinks: any = {};
    if (twitter) socialLinks.twitter = twitter.startsWith('@') ? twitter.slice(1) : twitter;
    if (telegram) socialLinks.telegram = telegram;
    if (website) socialLinks.website = website;
    if (farcaster) socialLinks.farcaster = farcaster.startsWith('@') ? farcaster.slice(1) : farcaster;

    // For demo/development - return mock response
    // In production, this would call the actual Bankr API
    const mockTokenAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    const result = {
      tokenAddress: mockTokenAddress,
      deployTxHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      name,
      symbol: symbol.toUpperCase(),
      explorerUrl: `https://basescan.org/token/${mockTokenAddress}`,
      status: 'deployed' as const,
    };

    // Try to share to Farcaster if we have the username
    if (farcasterUsername) {
      try {
        await shareTokenLaunch(name, symbol, mockTokenAddress, farcasterUsername);
      } catch (error) {
        console.log('Failed to share to Farcaster:', error);
        // Don't fail the whole request if sharing fails
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Deploy error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy token', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
