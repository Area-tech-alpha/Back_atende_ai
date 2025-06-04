import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://izmzxqzcsnaykofpcjjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bXp4cXpjc25heWtvZnBjampoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzc3MTM4NCwiZXhwIjoyMDQ5MzQ3Mzg0fQ.jMN_DdFGClZ5aQhZb1e9JuYYG4Cz6Obkt41O4K1523U';

export const supabase = createClient(supabaseUrl, supabaseKey);