// Farcaster / Neynar API Integration
// Docs: https://docs.neynar.com/

const NEYNAR_API_URL = 'https://api.neynar.com/v2';
const NEYNAR_API_KEY = process.env.FARCASTER_NEYNAR_API_KEY || '';
const NEYNAR_SIGNER_UUID = process.env.FARCASTER_SIGNER_UUID || '';

interface NeynarHeaders {
  'x-api-key': string;
  'Content-Type': 'application/json';
}

function getHeaders(): NeynarHeaders {
  return {
    'x-api-key': NEYNAR_API_KEY,
    'Content-Type': 'application/json',
  };
}

// ==========================================
// USER API
// ==========================================

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  profile: {
    bio: {
      text: string;
      mentionedProfiles: any[];
    };
    location?: {
      latitude: number;
      longitude: number;
      placeId: string;
      description: string;
    };
  };
  followerCount: number;
  followingCount: number;
  verifications: string[]; // Ethereum addresses
  verifiedAddresses: {
    ethAddresses: string[];
    solAddresses: string[];
  };
  activeStatus: 'active' | 'inactive';
}

export async function getUserByFid(fid: number): Promise<FarcasterUser> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/user/bulk?fids=${fid}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.users[0];
}

export async function getUserByUsername(username: string): Promise<FarcasterUser> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/user/by_username?username=${username}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  return response.json();
}

export async function getUsersByEthAddresses(addresses: string[]): Promise<FarcasterUser[]> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/user/bulk-by-address?addresses=${addresses.join(',')}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();
  return Object.values(data).flat();
}

// ==========================================
// CASTS (POSTS) API
// ==========================================

export interface Cast {
  hash: string;
  threadHash: string | null;
  parentHash: string | null;
  parentUrl: string | null;
  author: FarcasterUser;
  text: string;
  timestamp: string;
  embeds: Array<{
    url?: string;
    cast?: Cast;
    metadata?: {
      content_type: string;
      content_length: number;
      _len: number;
    };
  }>;
  reactions: {
    count: number;
    fids: number[];
  };
  recasts: {
    count: number;
    fids: number[];
  };
  replies: {
    count: number;
  };
  mentionedProfiles: FarcasterUser[];
}

export async function getFeed(channel?: string, limit: number = 50): Promise<Cast[]> {
  let url = `${NEYNAR_API_URL}/farcaster/feed?feed_type=following&limit=${limit}`;
  if (channel) {
    url += `&channel_id=${channel}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.casts;
}

export async function getUserCasts(fid: number, limit: number = 50): Promise<Cast[]> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/feed/user/${fid}?limit=${limit}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.casts;
}

// ==========================================
// PUBLISH CAST API
// ==========================================

export interface PublishCastRequest {
  text: string;
  embeds?: Array<{
    url?: string;
    castId?: {
      fid: number;
      hash: string;
    };
  }>;
  parent?: string; // Parent cast hash for replies
  channelId?: string;
}

export interface PublishCastResponse {
  cast: Cast;
}

export async function publishCast(request: PublishCastRequest): Promise<PublishCastResponse> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/cast`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      signer_uuid: NEYNAR_SIGNER_UUID,
      text: request.text,
      embeds: request.embeds || [],
      parent: request.parent,
      channel_id: request.channelId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  return response.json();
}

// Share token launch to Farcaster
export async function shareTokenLaunch(
  tokenName: string,
  tokenSymbol: string,
  tokenAddress: string,
  agentName?: string
): Promise<PublishCastResponse> {
  const text = `🚀 Launched ${tokenName} ($${tokenSymbol}) on @base!

Powered by ${agentName || 'Farcrystal AI'} 🤖

Token: ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}

Launch yours: https://farcrystal.xyz`;

  return publishCast({
    text,
    embeds: [
      { url: `https://basescan.org/token/${tokenAddress}` },
      { url: 'https://farcrystal.xyz' },
    ],
  });
}

// ==========================================
// REACTIONS API
// ==========================================

export async function likeCast(castHash: string): Promise<void> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/reaction`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      signer_uuid: NEYNAR_SIGNER_UUID,
      reaction_type: 'like',
      target: castHash,
    }),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }
}

export async function recastCast(castHash: string): Promise<void> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/reaction`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      signer_uuid: NEYNAR_SIGNER_UUID,
      reaction_type: 'recast',
      target: castHash,
    }),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }
}

// ==========================================
// CHANNELS API
// ==========================================

export interface Channel {
  id: string;
  url: string;
  name: string;
  description: string;
  imageUrl: string;
  leadFid: number;
  hostFids: number[];
  createdAt: string;
  followerCount: number;
}

export async function getChannel(channelId: string): Promise<Channel> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/channel?id=${channelId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  return response.json();
}

export async function getChannelFeed(channelId: string, limit: number = 50): Promise<Cast[]> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/feed/channels?id=${channelId}&limit=${limit}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }

  const data = await response.json();
  return data.casts;
}

// ==========================================
// NOTIFICATIONS (MINI APP)
// ==========================================

export interface NotificationRequest {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[]; // Farcaster notification tokens
}

export async function sendNotification(request: NotificationRequest): Promise<void> {
  const response = await fetch(`${NEYNAR_API_URL}/farcaster/notification`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Neynar API error: ${response.status}`);
  }
}
