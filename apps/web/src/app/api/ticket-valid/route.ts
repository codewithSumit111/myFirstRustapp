/**
 * Ticket Validity API Route
 * 
 * Checks if a ticket is valid (not used) on the smart contract.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

const TICKET_NFT_ABI = parseAbi([
  'function isTicketValid(uint256 tokenId) view returns (bool)',
]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenId = searchParams.get('tokenId');
  const contractAddress = searchParams.get('contract');

  if (!tokenId || !contractAddress) {
    return NextResponse.json(
      { success: false, error: 'Missing tokenId or contract address' },
      { status: 400 }
    );
  }

  try {
    const client = createPublicClient({
      chain: arbitrumSepolia,
      transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    });

    const isValid = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: TICKET_NFT_ABI,
      functionName: 'isTicketValid',
      args: [BigInt(tokenId)],
    });

    return NextResponse.json({
      success: true,
      valid: isValid,
    });
  } catch (error: any) {
    console.error('Failed to check ticket validity:', error);
    return NextResponse.json(
      { success: false, valid: false, error: error.message || 'Failed to check validity' },
      { status: 500 }
    );
  }
}
