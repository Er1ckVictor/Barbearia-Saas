import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({
    quiet: true
})

// Url e Role Key
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

// Verifica o SUPABASE_URL
if (!SUPABASE_URL) {
    throw new Error("SUPABASE URL not configured.")
}

// Verifica a SUPABASE_PUBLISHABLE_KEY
if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("SUPABASE_PUBLISHABLE_KEY not configured.")
}

// Verifica a SUPABASE_SECRET_KEY
if (!SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY not configured.")
}

// SUPABASE CLIENT
export const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
)

// SUPABASE ADMIN
export const supabaseAdmin = createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
)