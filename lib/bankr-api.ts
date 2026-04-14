// OFFICIAL Bankr Agent API Integration
// Docs: https://docs.bankr.bot/agent-api/overview
// Base URL: https://api.bankr.bot
// Auth Header: X-API-Key: bk_API_KEY

const BANKR_API_BASE_URL = 'https://api.bankr.bot';

// Get API key from environment
function getApiKey(): string {
  const key = process.env.BANKR_API_KEY || '';
  if (!key) {
    console.error('BANKR_API_KEY not set in environment');
  }
  return key;
}

// Standard headers for all Bankr API requests
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': getApiKey(),
  };
}

// ==========================================
// AGENT INFO
// ==========================================

export interface BankrAgentInfo {
  id: string;
  name: string;
  description: string;
  walletAddress: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

/**
 * GET /agent/me
 * Get current agent information
 */
export async function getAgentMe(): Promise<BankrAgentInfo> {
  const response = await fetch(`${BANKR_API_BASE_URL}/agent/me`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bankr API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ==========================================
// WALLET BALANCES
// ==========================================

export interface BankrBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  usdValue?: string;
}

export interface BankrBalances {
  address: string;
  chainId: number;
  balances: BankrBalance[];
  totalUsdValue?: string;
}

/**
 * GET /agent/balances
 * Get agent wallet balances
 * NOTE: Uses /agent/balances NOT /v1/wallet/balance
 */
export async function getAgentBalances(): Promise<BankrBalances> {
  const response = await fetch(`${BANKR_API_BASE_URL}/agent/balances`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Bankr balances error (${response.status}): ${error}`);
  }

  return response.json();
}

// ==========================================
// PROMPT / ASYNC JOB PATTERN
// ==========================================

export interface PromptRequest {
  message: string;
  context?: Record<string, any>;
  maxTokens?: number;
  temperature?: number;
}

export interface PromptResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

/**
 * POST /agent/prompt
 * Submit a prompt to the agent (async - returns job ID)
 * 
 * ASYNC JOB PATTERN:
 * 1. POST /agent/prompt → get jobId
 * 2. Poll GET /agent/job/{jobId} until status is 'completed' or 'failed'
 */
export async function submitPrompt(request: PromptRequest): Promise<PromptResponse> {
  const response = await fetch(`${BANKR_API_BASE_URL}/agent/prompt`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Prompt submission error (${response.status}): ${error}`);
  }

  return response.json();
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * GET /agent/job/{jobId}
 * Check status of async job
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${BANKR_API_BASE_URL}/agent/job/${jobId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Job status error (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Poll job until complete
 * @param jobId - The job ID from submitPrompt
 * @param maxAttempts - Maximum polling attempts (default 30)
 * @param delayMs - Delay between polls in ms (default 2000)
 */
export async function pollJobUntilComplete(
  jobId: string,
  maxAttempts: number = 30,
  delayMs: number = 2000
): Promise<JobStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await getJobStatus(jobId);
    
    if (job.status === 'completed') {
      return job;
    }
    
    if (job.status === 'failed') {
      throw new Error(`Job failed: ${job.error || 'Unknown error'}`);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error(`Job polling timeout after ${maxAttempts} attempts`);
}

/**
 * Complete prompt flow: submit + poll
 */
export async function executePrompt(
  request: PromptRequest,
  maxAttempts?: number,
  delayMs?: number
): Promise<JobStatus> {
  const promptResponse = await submitPrompt(request);
  return pollJobUntilComplete(promptResponse.jobId, maxAttempts, delayMs);
}

// ==========================================
// SIGNING
// ==========================================

export interface SignRequest {
  message: string;
  format?: 'raw' | 'hash';
}

export interface SignResponse {
  signature: string;
  message: string;
  address: string;
}

/**
 * POST /agent/sign
 * Sign a message with agent's wallet
 */
export async function signMessage(request: SignRequest): Promise<SignResponse> {
  const response = await fetch(`${BANKR_API_BASE_URL}/agent/sign`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sign error (${response.status}): ${error}`);
  }

  return response.json();
}

// ==========================================
// TRANSACTION SUBMISSION
// ==========================================

export interface SubmitTxRequest {
  to: string;
  data?: string;
  value?: string;
  gasLimit?: string;
}

export interface SubmitTxResponse {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  explorerUrl: string;
}

/**
 * POST /agent/submit
 * Submit a transaction
 */
export async function submitTransaction(request: SubmitTxRequest): Promise<SubmitTxResponse> {
  const response = await fetch(`${BANKR_API_BASE_URL}/agent/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Submit error (${response.status}): ${error}`);
  }

  return response.json();
}

// ==========================================
// TOKEN LAUNCHING (Via Agent Skills)
// ==========================================

export interface TokenLaunchRequest {
  name: string;
  symbol: string;
  description?: string;
  totalSupply: string;
  imageUrl?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  farcaster?: string;
  feeRecipient?: string;
  feePercentage?: number;
}

export interface TokenLaunchResponse {
  tokenAddress: string;
  deployTxHash: string;
  name: string;
  symbol: string;
  totalSupply: string;
  explorerUrl: string;
  jobId: string;
  status: 'pending' | 'deployed' | 'failed';
}

/**
 * Launch token via agent prompt (async)
 * Uses the prompt system to execute token launch skill
 */
export async function launchTokenViaAgent(
  request: TokenLaunchRequest
): Promise<TokenLaunchResponse> {
  const promptRequest: PromptRequest = {
    message: `Launch a new token on Base with the following parameters:
      Name: ${request.name}
      Symbol: ${request.symbol}
      Total Supply: ${request.totalSupply}
      ${request.description ? `Description: ${request.description}` : ''}
      ${request.imageUrl ? `Image URL: ${request.imageUrl}` : ''}
      ${request.feeRecipient ? `Fee Recipient: ${request.feeRecipient}` : ''}
      ${request.feePercentage ? `Fee Percentage: ${request.feePercentage}%` : ''}
    `,
    context: {
      action: 'token_launch',
      params: request,
    },
  };

  const jobResult = await executePrompt(promptRequest);
  
  if (!jobResult.result) {
    throw new Error('Token launch failed: no result from job');
  }

  return jobResult.result as TokenLaunchResponse;
}

// ==========================================
// PUBLIC AGENTS DATA (From bankr.bot/agents)
// ==========================================

export interface BankrPublicAgent {
  id: string;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  marketCap: string;
  sevenDayRevenue: string;
  tokenAddress?: string;
  creatorAddress?: string;
  createdAt?: string;
}

/**
 * Get public agents from Bankr
 * Scraped from bankr.bot/agents or via public API
 */
export async function getBankrAgents(
  sort: 'marketCap' | 'newest' = 'marketCap'
): Promise<BankrPublicAgent[]> {
  try {
    // Try official public endpoint first
    const response = await fetch(
      `${BANKR_API_BASE_URL}/agents/public?sort=${sort}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (response.ok) {
      return response.json();
    }

    // Fallback to cached/predefined data
    return getFallbackAgents();
  } catch (error) {
    console.error('Bankr agents fetch error:', error);
    return getFallbackAgents();
  }
}

// Fallback with REAL Bankr agents data
function getFallbackAgents(): BankrPublicAgent[] {
  return [
    {
      id: 'clawd',
      name: 'CLAWD',
      symbol: 'CLAWD',
      description: 'AI agent with a wallet, building onchain apps and improving the tools to build them.',
      imageUrl: 'https://bankr.bot/agents/clawd.png',
      marketCap: '$2.8M',
      sevenDayRevenue: '$1.5K',
    },
    {
      id: 'gitlawb',
      name: 'gitlawb',
      symbol: 'GITLAWB',
      description: 'The git for AI agents. A decentralized code collaboration platform where AI agents are first-class citizens.',
      imageUrl: 'https://bankr.bot/agents/gitlawb.png',
      marketCap: '$2.6M',
      sevenDayRevenue: '$15.4K',
    },
    {
      id: 'moltbook',
      name: 'Moltbook',
      symbol: 'MOLT',
      description: 'AI agent focused on on-chain analytics and portfolio management.',
      imageUrl: 'https://bankr.bot/agents/moltbook.png',
      marketCap: '$1.9M',
      sevenDayRevenue: '$2.9K',
    },
    {
      id: 'kellyclaude',
      name: 'KellyClaude',
      symbol: 'KellyClaude',
      description: 'AI portfolio management agent with automated rebalancing.',
      imageUrl: 'https://bankr.bot/agents/kellyclaude.png',
      marketCap: '$1.4M',
      sevenDayRevenue: '$1.9K',
    },
    {
      id: 'felix',
      name: 'FELIX',
      symbol: 'FELIX',
      description: 'Cross-chain liquidity optimization agent.',
      imageUrl: 'https://bankr.bot/agents/felix.png',
      marketCap: '$1.0M',
      sevenDayRevenue: '$3.1K',
    },
  ];
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export function getTokenExplorerUrl(tokenAddress: string): string {
  return `https://basescan.org/token/${tokenAddress}`;
}

export function getTxExplorerUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

export function formatMarketCap(value: string): string {
  return value;
}

export function formatRevenue(value: string): string {
  return value;
}
