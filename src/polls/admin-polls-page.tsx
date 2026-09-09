import { useEffect, useState } from 'react';
import type { AdminPollDetail, AdminPollSummary } from '../../shared/poll.ts';
import { beginGitHubLogin, clearAdminToken, getAdminToken, verifyAdminSession } from '../admin/api.ts';
import { listPolls, loadAdminPoll } from './api.ts';
import PollBuilder from './poll-builder.tsx';
import PollDetail from './poll-detail.tsx';

export default function AdminPollsPage() {
  const [authState, setAuthState] = useState<'checking' | 'signed-out' | 'ready'>('checking');
  const [polls, setPolls] = useState<AdminPollSummary[]>([]);
  const [selected, setSelected] = useState<AdminPollDetail | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPollDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refreshList = async () => {
    const items = await listPolls();
    setPolls(items);
    return items;
  };

  useEffect(() => {
    if (!getAdminToken()) { setAuthState('signed-out'); return; }
    verifyAdminSession().then(async () => {
      setPolls(await listPolls());
      setAuthState('ready');
    }).catch(() => {
      clearAdminToken();
      setAuthState('signed-out');
    });
  }, []);

  const selectPoll = async (id: number) => {
    setBusy(true); setMessage('');
    try { setSelected(await loadAdminPoll(id)); setBuilderOpen(false); setEditing(null); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Poll could not be loaded.'); }
    finally { setBusy(false); }
  };

  const acceptSaved = async (poll: AdminPollDetail) => {
    await refreshList();
    setSelected(poll);
    setBuilderOpen(false);
    setEditing(null);
  };

  if (authState === 'checking') return <main className="admin-auth-shell"><p>Checking administrator session…</p></main>;
  if (authState === 'signed-out') return (
    <main className="admin-auth-shell"><a className="brand" href="/">kirolos<span>.dev</span></a><p className="eyebrow">Private administration</p><h1>Availability polls</h1><p>The existing kirolos.dev owner authentication protects poll administration.</p><button className="admin-primary-button" type="button" onClick={beginGitHubLogin}>Sign in with GitHub</button></main>
  );

  return (
    <div className="poll-admin-shell">
      <header className="poll-admin-header">
        <a className="brand" href="/">kirolos<span>.dev</span></a>
        <nav><a href="/admin">Portfolio admin</a><a className="is-active" href="/admin/polls">Availability polls</a></nav>
      </header>
      <main className="poll-admin-layout">
        <aside className="poll-admin-sidebar">
          <div className="poll-sidebar-heading"><div><p className="eyebrow">Scheduling</p><h2>Polls</h2></div><button className="poll-primary-button" type="button" onClick={() => { setBuilderOpen(true); setEditing(null); setSelected(null); }}>Create Poll</button></div>
          <div className="poll-list">
            {polls.length === 0 && <p>No polls yet.</p>}
            {polls.map((poll) => (
              <button key={poll.id} type="button" className={selected?.id === poll.id ? 'is-active' : ''} onClick={() => void selectPoll(poll.id)}>
                <span className={`poll-status-dot status-${poll.status}`} aria-hidden="true" />
                <div><strong>{poll.title}</strong><span>{poll.responseCount}/{poll.participantCount} responded · {poll.status}</span></div>
              </button>
            ))}
          </div>
          {message && <p className="poll-message poll-message--error">{message}</p>}
        </aside>
        <div className="poll-admin-main">
          {busy && !selected && !builderOpen && <p>Loading poll…</p>}
          {!selected && !builderOpen && <section className="poll-admin-empty"><p className="eyebrow">Availability polling</p><h1>Visual scheduling without account friction.</h1><p>Create a focused poll, publish its private bearer link, and compare committee availability while preserving Online / In person / Either modes.</p><button className="poll-primary-button" type="button" onClick={() => setBuilderOpen(true)}>Create Poll</button></section>}
          {builderOpen && <PollBuilder key={editing?.id ?? 'new'} editing={editing} onSaved={(poll) => void acceptSaved(poll)} onCancel={() => { setBuilderOpen(false); setEditing(null); }} />}
          {selected && !builderOpen && <PollDetail key={selected.id} poll={selected} onRefresh={(poll) => { setSelected(poll); void refreshList(); }} onEdit={() => { setEditing(selected); setBuilderOpen(true); }} onDeleted={() => { setSelected(null); void refreshList(); }} />}
        </div>
      </main>
    </div>
  );
}
