import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for elevated privileges
    )

    const { action, username, password } = await req.json()

    if (action === 'signup') {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.trim())
        .single()

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: { message: 'Username already taken' } }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      // Validate input
      if (username.trim().length < 3) {
        return new Response(
          JSON.stringify({ error: { message: 'Username must be at least 3 characters' } }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: { message: 'Password must be at least 6 characters' } }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert([{ username: username.trim(), password }])
        .select()
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'signin') {
      // Check credentials
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: { message: 'Invalid username or password' } }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401
          }
        )
      }

      const userData = {
        id: data.id,
        username: data.username,
        created_at: data.created_at
      }

      return new Response(
        JSON.stringify({ user: userData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: { message: 'Invalid action' } }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: { message: 'Internal server error' } }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})