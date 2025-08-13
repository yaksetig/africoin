export type ParsedTxError = {
  title: string;
  description: string;
  code?: string;
};

function pickFirstTruthy(...vals: Array<any>): string | undefined {
  for (const v of vals) if (typeof v === 'string' && v.trim()) return v;
  return undefined;
}

function collectMessage(err: any): string {
  const parts = [
    err?.shortMessage,
    err?.reason,
    err?.message,
    err?.info?.error?.message,
    err?.error?.message,
    err?.cause?.shortMessage,
    err?.cause?.message,
  ].filter(Boolean) as string[];
  return parts.join(' | ');
}

export function parseEthersError(error: unknown): ParsedTxError {
  const err = error as any;
  const code: string | undefined = err?.code || err?.info?.error?.code;
  const reason: string | undefined = err?.reason;
  const short: string | undefined = err?.shortMessage;
  const msg = (collectMessage(err) || 'Transaction failed').toLowerCase();

  // User rejected
  if (code === 'ACTION_REJECTED' || msg.includes('user rejected')) {
    return {
      title: 'Transaction rejected',
      description: 'You cancelled the request in your wallet.',
      code,
    };
  }

  // Insufficient funds / balance
  if (msg.includes('insufficient funds') || msg.includes('insufficient balance')) {
    return {
      title: 'Insufficient funds',
      description: 'Not enough balance to cover gas and fees.',
      code,
    };
  }

  // Nonce / replacement fee
  if (msg.includes('nonce too low') || msg.includes('replacement') || msg.includes('underpriced')) {
    return {
      title: 'Pending transaction conflict',
      description: 'There is a pending tx or max fee is too low. Try again with a higher fee.',
      code,
    };
  }

  // Invalid address
  if (msg.includes('invalid address')) {
    return {
      title: 'Invalid address',
      description: 'Please check the contract or recipient address.',
      code,
    };
  }

  // Gas estimation / call exception
  if (code === 'CALL_EXCEPTION' || msg.includes('execution reverted')) {
    const reasonText = pickFirstTruthy(reason, short);
    return {
      title: 'Transaction would revert',
      description: reasonText ? reasonText : 'The transaction is likely to fail. Check permissions or inputs.',
      code,
    };
  }

  if (msg.includes('missing revert data') || msg.includes('always failing transaction') || msg.includes('gas required exceeds allowance')) {
    return {
      title: 'Simulation failed',
      description: 'This call would likely revert. You may not have permission or the data is invalid.',
      code,
    };
  }

  return {
    title: 'Transaction error',
    description: pickFirstTruthy(short, reason, collectMessage(err)) || 'Something went wrong while sending the transaction.',
    code,
  };
}
