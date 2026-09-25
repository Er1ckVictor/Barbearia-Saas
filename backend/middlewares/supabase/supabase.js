import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({
    quiet: true
}) 

// Url e Role Key
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ROLE_KEY = process.env.SUPABASE_ROLE_KEY

// Verifica o SUPABASE_URL
if (!SUPABASE_URL) {
    throw new Error("SUPABASE URL not configured.")
}

// Verifica a SUPABASE_ROLE_KEY
if (!SUPABASE_ROLE_KEY) {
    throw new Error("SUPABASE_ROLE_KEY not configured.")
}

// SUPABASE
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ROLE_KEY
)

export default supabase;