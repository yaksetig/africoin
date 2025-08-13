import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { encode } from 'https://deno.land/std@0.195.0/encoding/base64.ts';

const supabaseUrl = 'https://awuadhofwkegouccnlen.supabase.co';
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
const jwtSecret = Deno.env.get('SESSION_JWT_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify Ethereum signature
async function verifySignature(message: string, signature: string, address: string): Promise<boolean> {
  try {
    // Import ethers for signature verification
    const { ethers } = await import('https://esm.sh/ethers@6.15.0');
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Helper function to generate JWT
async function generateJWT(walletAddress: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(jwtSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payload = {
    wallet_address: walletAddress,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
    iat: Math.floor(Date.now() / 1000),
  };

  return await create({ alg: 'HS256', typ: 'JWT' }, payload, key);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/nonce') && req.method === 'POST') {
      // Generate nonce for wallet
      const { walletAddress } = await req.json();
      
      if (!walletAddress) {
        return new Response(JSON.stringify({ error: 'Wallet address required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const nonce = crypto.randomUUID();
      
      // Store nonce in database
      const { error } = await supabase
        .from('wallet_nonces')
        .insert({
          nonce,
          wallet_address: walletAddress.toLowerCase(),
        });

      if (error) {
        console.error('Failed to store nonce:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate nonce' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        nonce,
        message: `Sign this message to authenticate with your wallet:\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/verify') && req.method === 'POST') {
      // Verify signature and issue session token
      const { walletAddress, signature, nonce } = await req.json();
      
      if (!walletAddress || !signature || !nonce) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify nonce exists and hasn't expired
      const { data: nonceData, error: nonceError } = await supabase
        .from('wallet_nonces')
        .select('*')
        .eq('nonce', nonce)
        .eq('wallet_address', walletAddress.toLowerCase())
        .gte('expires_at', new Date().toISOString())
        .single();

      if (nonceError || !nonceData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired nonce' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reconstruct and verify the message
      const message = `Sign this message to authenticate with your wallet:\n\nNonce: ${nonce}\nTimestamp: ${nonceData.created_at}`;
      const isValidSignature = await verifySignature(message, signature, walletAddress);

      if (!isValidSignature) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete used nonce
      await supabase
        .from('wallet_nonces')
        .delete()
        .eq('nonce', nonce);

      // Generate session token
      const sessionToken = await generateJWT(walletAddress.toLowerCase());

      return new Response(JSON.stringify({ 
        success: true,
        sessionToken,
        expiresIn: 3600 // 1 hour
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wallet-auth function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});