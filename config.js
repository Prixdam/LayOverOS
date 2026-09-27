// Configuración de Supabase
// Project Settings > API > Project URL / publishable key

window.SUPABASE_URL = "https://hyosutjoajvmsqjjfacs.supabase.co";
window.SUPABASE_ANON_KEY = "sb_publishable_P7KvAWyd6mORIFe9_IWi8A_T9M_1fAe";

if (window.supabase) {
  window.supabaseClient = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );
}
