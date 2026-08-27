import { useEffect, useState, type FormEvent } from 'react';
import type { PublicOpinion } from '../shared/opinion.ts';
import FloatingOpinions from './components/floating-opinions.tsx';
import { loadOpinions, submitOpinion } from './data/opinions.ts';

type FormModel = {
  displayName: string;
  relationship: string;
  opinion: string;
  consentToPublish: boolean;
  website: string;
};

const EMPTY_FORM: FormModel = {
  displayName: '',
  relationship: '',
  opinion: '',
  consentToPublish: false,
  website: '',
};

export default function OpinionsPage() {
  const [opinions, setOpinions] = useState<PublicOpinion[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [form, setForm] = useState<FormModel>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadOpinions()
      .then((items) => {
        setOpinions(items);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await submitOpinion({
        displayName: form.displayName,
        relationship: form.relationship || null,
        opinion: form.opinion,
        consentToPublish: form.consentToPublish,
        website: form.website,
      });
      setForm(EMPTY_FORM);
      setMessage('Thank you. Your opinion was received and will appear after review.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit your opinion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-shell opinions-shell">
      <header className="site-nav">
        <a className="brand" href="/" aria-label="kirolos.dev home">kirolos<span>.dev</span></a>
        <nav aria-label="Primary navigation">
          <a href="/#history">History</a>
          <a href="/skills">Skills</a>
          <a href="#leave-opinion">Leave an opinion</a>
        </nav>
      </header>

      <main className="opinions-page">
        <section className="opinions-intro">
          <p className="eyebrow">People, not metrics</p>
          <h1>What people say.</h1>
          <p>
            A moving field of words from people who have worked, studied, served, or built alongside me.
            Submissions are reviewed before publication so the page remains a record of real human voices rather than an open comment feed.
          </p>
        </section>

        {loadState === 'loading' && <div className="opinion-stage opinion-stage--empty"><p>Loading opinions…</p></div>}
        {loadState === 'error' && <div className="opinion-stage opinion-stage--empty"><p>Opinions could not be loaded right now.</p></div>}
        {loadState === 'ready' && <FloatingOpinions opinions={opinions} />}

        <section className="opinion-form-section" id="leave-opinion" aria-labelledby="opinion-form-title">
          <div>
            <p className="eyebrow">Add your voice</p>
            <h2 id="opinion-form-title">Leave an opinion.</h2>
            <p>Your name, relationship, and words are stored only for this portfolio submission. Nothing is published automatically.</p>
          </div>

          <form className="opinion-form" onSubmit={(event) => void submit(event)}>
            <label>
              Name
              <input
                maxLength={80}
                required
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              />
            </label>
            <label>
              How you know me <span>optional</span>
              <input
                maxLength={120}
                value={form.relationship}
                placeholder="Colleague, professor, collaborator…"
                onChange={(event) => setForm({ ...form, relationship: event.target.value })}
              />
            </label>
            <label className="opinion-form-wide">
              Your opinion
              <textarea
                minLength={12}
                maxLength={600}
                required
                rows={5}
                value={form.opinion}
                onChange={(event) => setForm({ ...form, opinion: event.target.value })}
              />
              <small>{form.opinion.length}/600</small>
            </label>
            <label className="opinion-honeypot" aria-hidden="true">
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => setForm({ ...form, website: event.target.value })}
              />
            </label>
            <label className="opinion-consent opinion-form-wide">
              <input
                type="checkbox"
                required
                checked={form.consentToPublish}
                onChange={(event) => setForm({ ...form, consentToPublish: event.target.checked })}
              />
              <span>I consent to this name, relationship, and quote being published on kirolos.dev if approved.</span>
            </label>
            <div className="opinion-form-actions opinion-form-wide">
              <button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Submit for review'}</button>
              {message && <p role="status">{message}</p>}
            </div>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
