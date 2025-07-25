import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qbezqfbovuyiphkvvnen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZXpxZmJvdnV5aXBoa3Z2bmVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5ODEzOCwiZXhwIjoyMDY4ODc0MTM4fQ.CqGJvsNQ-n8cw3Kej6dNTUznrdagWYSl3rGeHbZqKa0';

export const supabase = createClient(supabaseUrl, supabaseKey);

