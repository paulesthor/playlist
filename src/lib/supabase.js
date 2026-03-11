import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function logListeningHistory(trackData) {
    if (!supabase) {
        console.warn('Supabase not configured. Listening history skipped.');
        return;
    }

    try {
        const { error } = await supabase
            .from('listening_history')
            .insert([trackData]);

        if (error) throw error;
        console.log('Listening history logged successfully for:', trackData.track_name);
    } catch (err) {
        console.error('Failed to log listening history to Supabase:', err);
    }
}
