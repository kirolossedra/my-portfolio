import { useEffect, useState } from 'react';
import { exchangeOAuthCode, setAdminToken } from './api.ts';

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Completing GitHub sign-in…');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const code = params.get('code');

    if (error) {
      setMessage(error === 'not_authorized'
        ? 'This GitHub account is not authorized to administer the portfolio.'
        : 'GitHub sign-in was not completed.');
      return;
    }

    if (!code) {
      setMessage('The authentication callback is missing its exchange code.');
      return;
    }

    exchangeOAuthCode(code)
      .then(({ token }) => {
        setAdminToken(token);
        window.history.replaceState({}, '', '/admin');
        window.location.replace('/admin');
      })
      .catch((requestError: unknown) => {
        setMessage(requestError instanceof Error ? requestError.message : 'Authentication failed.');
      });
  }, []);

  return (
    <main className="admin-auth-shell">
      <a className="brand" href="/">kirolos<span>.dev</span></a>
      <p className="eyebrow">Administrator</p>
      <h1>GitHub authentication</h1>
      <p>{message}</p>
      <a className="text-link" href="/admin">Return to admin</a>
    </main>
  );
}
