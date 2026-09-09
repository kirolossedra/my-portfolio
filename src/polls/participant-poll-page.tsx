import { useEffect, useMemo, useState } from 'react';
import type { AvailabilityMode, PollDefinition, PublicPoll } from '../../shared/poll.ts';
import AvailabilityGrid from './availability-grid.tsx';
import { mapToSelections, selectionsToMap } from './selection-map.ts';
import { loadParticipantResponse, loadPublicPoll, saveParticipantResponse } from './api.ts';

function definitionFromPoll(poll: PublicPoll): PollDefinition {
  return {
    schemaVersion: 1,
    title: poll.title,
    description: poll.description,
    timezone: poll.timezone,
    participantNames: poll.participants.map((participant) => participant.displayName),
    dates: poll.dates,
    timeRanges: poll.timeRanges,
    slotWidthMinutes: poll.slotWidthMinutes,
  };
}

export default function ParticipantPollPage({ token }: { token: string }) {
  const [poll, setPoll] = useState<PublicPoll | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [participantId, setParticipantId] = useState('');
  const [phase, setPhase] = useState<'identify' | 'grid' | 'confirmed'>('identify');
  const [revision, setRevision] = useState<number | null>(null);
  const [selections, setSelections] = useState<Map<string, AvailabilityMode>>(new Map());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    loadPublicPoll(token)
      .then((data) => {
        if (!cancelled) {
          setPoll(data);
          setLoadState('ready');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'This availability poll could not be loaded.');
          setLoadState('error');
        }
      });
    return () => { cancelled = true; };
  }, [token]);

  const definition = useMemo(() => poll ? definitionFromPoll(poll) : null, [poll]);
  const participant = poll?.participants.find((item) => item.id === Number(participantId));
  const editable = poll?.status === 'open';

  const continueToGrid = async () => {
    const id = Number(participantId);
    if (!poll || !Number.isInteger(id) || id <= 0) return;
    setBusy(true);
    setMessage('');
    try {
      const existing = await loadParticipantResponse(token, id);
      setRevision(existing?.revision ?? null);
      setSelections(existing ? selectionsToMap(existing.selections) : new Map());
      setPhase('grid');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your saved response.');
    } finally {
      setBusy(false);
    }
  };

  const reloadSavedResponse = async () => {
    const id = Number(participantId);
    if (!poll || !Number.isInteger(id) || id <= 0) return;
    setBusy(true);
    try {
      const existing = await loadParticipantResponse(token, id);
      setRevision(existing?.revision ?? null);
      setSelections(existing ? selectionsToMap(existing.selections) : new Map());
      setMessage('Saved response reloaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reload the saved response.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const id = Number(participantId);
    if (!poll || !editable || !Number.isInteger(id)) return;
    setBusy(true);
    setMessage('');
    try {
      const saved = await saveParticipantResponse(token, {
        participantId: id,
        revision,
        selections: mapToSelections(selections),
      });
      setRevision(saved.revision);
      setSelections(selectionsToMap(saved.selections));
      setPhase('confirmed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your availability.');
    } finally {
      setBusy(false);
    }
  };

  if (loadState === 'loading') return <main className="poll-public-shell"><p>Loading availability poll…</p></main>;
  if (loadState === 'error' || !poll || !definition) {
    return <main className="poll-public-shell poll-error"><a className="brand" href="/">kirolos<span>.dev</span></a><h1>Poll unavailable</h1><p>{message}</p></main>;
  }

  return (
    <main className={`poll-public-shell${phase === 'identify' ? ' poll-public-shell--identify' : ''}`}>
      <header className="poll-public-header">
        <a className="brand" href="/">kirolos<span>.dev</span></a>
        <span className={`poll-status-pill status-${poll.status}`}>{poll.status}</span>
      </header>

      <section className="poll-intro">
        <p className="eyebrow">Availability poll</p>
        <h1>{poll.title}</h1>
        {poll.description && <p>{poll.description}</p>}
        <div className="poll-meta-row">
          <span>Toronto time</span><span>{poll.slotWidthMinutes}-minute slots</span><span>{poll.dates.length} date{poll.dates.length === 1 ? '' : 's'}</span>
        </div>
        {poll.finalization && (
          <div className="poll-finalized-banner">
            <strong>Final meeting selected</strong>
            <span>{poll.finalization.date} · {poll.finalization.startTime}–{poll.finalization.endTime} · {poll.finalization.timezone}</span>
            {poll.finalization.location && <span>{poll.finalization.location}</span>}
            {poll.finalization.meetingLink && <a href={poll.finalization.meetingLink} rel="noreferrer">Meeting link ↗</a>}
            {poll.finalization.note && <span>{poll.finalization.note}</span>}
          </div>
        )}
      </section>

      {phase === 'identify' && (
        <section className="poll-step-card poll-identify" aria-labelledby="poll-identify-title">
          <div className="poll-step-number">1</div>
          <div>
            <p className="eyebrow">First</p>
            <h2 id="poll-identify-title">Select your name</h2>
            <p>Your existing response will be loaded if you have already submitted one.</p>
            <label>
              Expected participant
              <select value={participantId} onChange={(event) => setParticipantId(event.target.value)}>
                <option value="">Choose your name…</option>
                {poll.participants.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}
              </select>
            </label>
            <button className="poll-primary-button" type="button" disabled={!participantId || busy} onClick={() => void continueToGrid()}>
              {busy ? 'Loading…' : 'Next'}
            </button>
            {message && <p className="poll-message poll-message--error" role="alert">{message}</p>}
          </div>
        </section>
      )}

      {phase === 'grid' && (
        <section className="poll-response-stage">
          <div className="poll-response-heading">
            <div>
              <button className="poll-text-button" type="button" onClick={() => setPhase('identify')}>← Change participant</button>
              <p className="eyebrow">Availability for {participant?.displayName}</p>
              <h2>{editable ? 'Mark every slot that works.' : 'Your saved availability'}</h2>
              {!editable && <p>This poll is {poll.status}; responses can be viewed but not changed.</p>}
            </div>
            <span className="poll-saved-state">{revision ? `Saved response · revision ${revision}` : 'No response submitted yet'}</span>
          </div>
          <AvailabilityGrid definition={definition} value={selections} onChange={setSelections} disabled={!editable || busy} />
          {message && (
            <div className="poll-message-row">
              <p className={message === 'Saved response reloaded.' ? 'poll-message' : 'poll-message poll-message--error'} role={message === 'Saved response reloaded.' ? 'status' : 'alert'}>{message}</p>
              {message.toLowerCase().includes('reload') && <button className="poll-secondary-button" type="button" disabled={busy} onClick={() => void reloadSavedResponse()}>Reload saved response</button>}
            </div>
          )}
          {editable && (
            <div className="poll-submit-bar">
              <span>{selections.size} available slot{selections.size === 1 ? '' : 's'} selected</span>
              <button className="poll-primary-button" type="button" disabled={busy} onClick={() => void submit()}>{busy ? 'Saving…' : revision ? 'Update availability' : 'Submit availability'}</button>
            </div>
          )}
        </section>
      )}

      {phase === 'confirmed' && (
        <section className="poll-step-card poll-confirmation" aria-live="polite">
          <div className="poll-confirm-icon" aria-hidden="true">✓</div>
          <div>
            <p className="eyebrow">Saved</p>
            <h2>Availability updated.</h2>
            <p>{participant?.displayName}, your response is associated with your name in this poll. You can return through this same link, select your name, and edit it while the poll remains open.</p>
            <button className="poll-secondary-button" type="button" onClick={() => setPhase('grid')}>Review response</button>
          </div>
        </section>
      )}
    </main>
  );
}
