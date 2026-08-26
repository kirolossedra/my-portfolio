import { useEffect, useMemo, useState } from 'react';
import type { AdminOpinion, OpinionStatus } from '../../shared/opinion.ts';
import {
  deleteAdminOpinion,
  listAdminOpinions,
  moderateAdminOpinion,
} from './api.ts';

export default function OpinionsAdminPanel() {
  const [opinions, setOpinions] = useState<AdminOpinion[]>([]);
  const [filter, setFilter] = useState<OpinionStatus | 'all'>('pending');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    const items = await listAdminOpinions();
    setOpinions(items);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : 'Could not load opinions.');
    });
  }, []);

  const visible = useMemo(
    () => filter === 'all' ? opinions : opinions.filter((opinion) => opinion.status === filter),
    [filter, opinions],
  );

  const moderate = async (id: number, status: 'approved' | 'rejected') => {
    setBusyId(id);
    setMessage('');
    try {
      await moderateAdminOpinion(id, status);
      await refresh();
      setMessage(status === 'approved' ? 'Opinion approved.' : 'Opinion rejected.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update opinion.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this opinion permanently?')) return;
    setBusyId(id);
    setMessage('');
    try {
      await deleteAdminOpinion(id);
      await refresh();
      setMessage('Opinion deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete opinion.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="admin-opinions">
      <div className="admin-editor-heading">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1>People’s opinions</h1>
          <p className="admin-opinions-lead">Submissions remain private until you explicitly approve them.</p>
        </div>
      </div>

      <div className="admin-opinion-filters" role="group" aria-label="Opinion status filter">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            className={filter === status ? 'is-active' : ''}
            type="button"
            key={status}
            onClick={() => setFilter(status)}
          >
            {status[0]?.toUpperCase()}{status.slice(1)}
          </button>
        ))}
      </div>

      {message && <p className="admin-message" role="status">{message}</p>}

      <div className="admin-opinion-list">
        {visible.map((opinion) => (
          <article className="admin-opinion-card" key={opinion.id}>
            <div className="admin-opinion-meta">
              <div>
                <strong>{opinion.displayName}</strong>
                {opinion.relationship && <span>{opinion.relationship}</span>}
              </div>
              <small>{opinion.status} · {new Date(opinion.createdAt).toLocaleDateString()}</small>
            </div>
            <blockquote>“{opinion.opinion}”</blockquote>
            <div className="admin-opinion-actions">
              {opinion.status !== 'approved' && (
                <button type="button" disabled={busyId === opinion.id} onClick={() => void moderate(opinion.id, 'approved')}>Approve</button>
              )}
              {opinion.status !== 'rejected' && (
                <button type="button" disabled={busyId === opinion.id} onClick={() => void moderate(opinion.id, 'rejected')}>Reject</button>
              )}
              <button className="admin-danger-button" type="button" disabled={busyId === opinion.id} onClick={() => void remove(opinion.id)}>Delete</button>
            </div>
          </article>
        ))}
        {!visible.length && <p className="admin-help">No opinions in this view.</p>}
      </div>
    </main>
  );
}
