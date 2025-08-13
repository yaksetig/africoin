import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const supabaseUrl = 'https://awuadhofwkegouccnlen.supabase.co';
const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!;
const jwtSecret = Deno.env.get('SESSION_JWT_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to verify JWT and extract wallet address
async function verifyJWT(token: string): Promise<string | null> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const payload = await verify(token, key);
    return payload.wallet_address as string;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract and verify session token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const walletAddress = await verifyJWT(token);

    if (!walletAddress) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    
    if (req.method === 'GET') {
      // Get all contracts for the wallet
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('owner_address', walletAddress)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch contracts:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch contracts' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ contracts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Save a new contract
      const { contractAddress, abi, label, network } = await req.json();

      if (!contractAddress || !abi) {
        return new Response(JSON.stringify({ error: 'Contract address and ABI are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: contract, error } = await supabase
        .from('contracts')
        .upsert({
          owner_address: walletAddress,
          contract_address: contractAddress.toLowerCase(),
          abi,
          label: label || null,
          network: network || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to save contract:', error);
        return new Response(JSON.stringify({ error: 'Failed to save contract' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ contract }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'DELETE') {
      // Delete a contract
      const contractId = url.pathname.split('/').pop();
      
      if (!contractId) {
        return new Response(JSON.stringify({ error: 'Contract ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', contractId)
        .eq('owner_address', walletAddress);

      if (error) {
        console.error('Failed to delete contract:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete contract' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in contracts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});