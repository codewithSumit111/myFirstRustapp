/**
 * Ticket Info API Route
 * 
 * Reads ticket information from the smart contract.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

const TICKET_NFT_ABI = parseAbi([
  'function getTicketInfo(uint256 tokenId) view returns (uint256 eventId, bytes eventName, bytes eventDate, bytes seatInfo, bool isUsed, uint256 usedAt, address originalOwner)',
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

    const result = await client.readContract({
      address: contractAddress as `0x${string}`,
      abi: TICKET_NFT_ABI,
      functionName: 'getTicketInfo',
      args: [BigInt(tokenId)],
    });

    // Decode bytes to strings
    const decoder = new TextDecoder();
    const eventName = decoder.decode(result[1]);
    const eventDate = decoder.decode(result[2]);
    const seatInfo = decoder.decode(result[3]);

    return NextResponse.json({
      success: true,
      eventId: result[0].toString(),
      eventName,
      eventDate,
      seatInfo,
      isUsed: result[4],
      usedAt: result[5].toString(),
      originalOwner: result[6],
    });
  } catch (error: any) {
    console.error('Failed to read ticket info:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read ticket info' },
      { status: 500 }
    );
  }
}
