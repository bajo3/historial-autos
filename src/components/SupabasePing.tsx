import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SupabasePing = () => {
  useEffect(() => {
    const ping = async () => {
      try {
        await supabase.from('vehicles').select('id').limit(1);
      } catch (error) {
        console.error('[SupabasePing] Error al hacer ping', error);
      }
    };

    ping();
    const id = setInterval(ping, 5 * 60 * 1000);

    return () => clearInterval(id);
  }, []);

  return null;
};

export default SupabasePing;
