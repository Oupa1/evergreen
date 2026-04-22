import { supabase } from './supabase';

/**
 * Resolves the active school_id for the current session by checking (in order):
 *  1. Subdomain — e.g. "greenwood" in greenwood.yoursystem.co.za
 *  2. ?slug=greenwood query param (for testing on Replit / localhost)
 *  3. ?school_id=X query param (legacy demo links)
 *  4. localStorage 'school_id' (already authenticated session)
 *  5. Default → 1
 *
 * If a slug is resolved it also persists the school_id to localStorage so
 * subsequent pages in the same session don't need to re-query.
 */
export async function resolveSchoolId(): Promise<number> {
  const params = new URLSearchParams(window.location.search);

  // 1. Detect subdomain — ignore localhost, www, and *.replit.dev hostnames
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  let slugFromHostname: string | null = null;
  if (
    parts.length >= 3 &&
    !hostname.includes('localhost') &&
    !hostname.includes('replit.dev') &&
    !hostname.includes('repl.co') &&
    parts[0] !== 'www'
  ) {
    slugFromHostname = parts[0];
  }

  const slug = slugFromHostname || params.get('slug');

  if (slug) {
    const { data } = await supabase
      .from('schools')
      .select('id')
      .eq('slug', slug)
      .single();
    if (data?.id) {
      localStorage.setItem('school_id', String(data.id));
      return data.id;
    }
  }

  // 2. ?school_id= query param (legacy / super-admin demo links)
  const qsSchoolId = params.get('school_id');
  if (qsSchoolId) {
    localStorage.setItem('school_id', qsSchoolId);
    return parseInt(qsSchoolId, 10);
  }

  // 3. Already stored in session
  const stored = localStorage.getItem('school_id');
  if (stored) return parseInt(stored, 10);

  // 4. Fallback
  return 1;
}
