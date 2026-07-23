'use client';

import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export function AdminLogoutButton() {
  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    window.location.assign('/secure-access');
  };

  return (
    <button className="button-ghost" onClick={handleLogout} type="button">
      Sign out
    </button>
  );
}
