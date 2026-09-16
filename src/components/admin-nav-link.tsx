import { useEffect, useState } from 'react';
import { clearAdminToken, getAdminToken, verifyAdminSession } from '../admin/api.ts';

export default function AdminNavLink() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAdminToken()));

  useEffect(() => {
    if (!getAdminToken()) return;
    let cancelled = false;
    verifyAdminSession()
      .then(() => { if (!cancelled) setAuthenticated(true); })
      .catch(() => {
        clearAdminToken();
        if (!cancelled) setAuthenticated(false);
      });
    return () => { cancelled = true; };
  }, []);

  const label = authenticated ? 'Dashboard' : 'Admin Login';

  return (
    <a className="admin-nav-link" href="/admin" aria-label={label}>
      <span className="admin-nav-link__full">{label}</span>
      <span className="admin-nav-link__compact" aria-hidden="true">Admin</span>
    </a>
  );
}
