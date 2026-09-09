import { useMemo, useState } from 'react';
import type { AdminPollDetail, IntersectionFilter, PollStatus } from '../../shared/poll.ts';
import { computeIntersections, filterIntersections, pollDefinitionToJson, pollDefinitionToXml } from '../../shared/poll.ts';
import { deleteAdminPoll, downloadAdminPollFile, finalizeAdminPoll, loadAdminPoll, removeParticipantResponse, rotateAdminPollLink, updatePollStatus } from './api.ts';
import { AdminResponseGrid } from './admin-response-grid.tsx';
import { formatDate, formatTime, modeLabel, participantColorClass, participantOrdinal, type AdminView } from './admin-poll-utils.ts';

export default function PollDetail({ poll, onRefresh, onEdit, onDeleted }: {
  poll: AdminPollDetail;
  onRefresh: (poll: AdminPollDetail) => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const [view, setView] = useState<AdminView>('responses');
  const [filter, setFilter] = useState<IntersectionFilter>({ kind: 'full' });
  const [threshold, setThreshold] = useState(80);
  const [location, setLocation] = useState(poll.finalization?.location ?? '');
  const [meetingLink, setMeetingLink] = useState(poll.finalization?.meetingLink ?? '');
  const [note, setNote] = useState(poll.finalization?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const intersections = useMemo(
    () => computeIntersections(poll.definition, poll.participants, poll.responses),
    [poll],
  );
  const filtered = useMemo(
    () => filterIntersections(intersections, filter.kind === 'threshold' ? { kind: 'threshold', percentage: threshold } : filter),
    [filter, intersections, threshold],
  );
  const publicUrl = `${window.location.origin}/poll/${poll.publicToken}`;

  const changeStatus = async (status: PollStatus) => {
    setBusy(true); setMessage('');
    try { onRefresh(await updatePollStatus(poll.id, status)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Status could not be changed.'); }
    finally { setBusy(false); }
  };

  const rotateLink = async () => {
    if (!window.confirm('Regenerate the participant link? The current link will stop working immediately.')) return;
    setBusy(true); setMessage('');
    try { onRefresh(await rotateAdminPollLink(poll.id)); setMessage('Participant link regenerated. Share the new link; the previous link is now invalid.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Participant link could not be regenerated.'); }
    finally { setBusy(false); }
  };

  const deleteResponse = async (participantId: number) => {
    if (!window.confirm('Delete this participant response? The expected participant will remain in the poll.')) return;
    setBusy(true); setMessage('');
    try { await removeParticipantResponse(poll.id, participantId); onRefresh(await loadAdminPoll(poll.id)); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Response could not be deleted.'); }
    finally { setBusy(false); }
  };

  const finalize = async (date: string, startTime: string) => {
    if (!window.confirm(`Finalize ${date} ${startTime} as the meeting slot?`)) return;
    setBusy(true); setMessage('');
    try { onRefresh(await finalizeAdminPoll(poll.id, { date, startTime, location, meetingLink, note })); setMessage('Meeting slot finalized.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Poll could not be finalized.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="poll-admin-detail">
      <div className="poll-section-heading">
        <div><p className="eyebrow">Poll detail</p><h1>{poll.title}</h1><p>{poll.description}</p></div>
        <div className="poll-detail-actions"><button type="button" onClick={onEdit}>Edit definition</button><button type="button" className="poll-danger-button" onClick={() => {
          if (!window.confirm(`Delete “${poll.title}” and all responses?`)) return;
          setBusy(true);
          void deleteAdminPoll(poll.id).then(onDeleted).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Poll could not be deleted.')).finally(() => setBusy(false));
        }}>Delete</button></div>
      </div>

      <div className="poll-detail-summary">
        <span className={`poll-status-pill status-${poll.status}`}>{poll.status}</span>
        <span>{poll.responseCount}/{poll.participantCount} responded</span>
        <span>{poll.timezone}</span>
        <span>{poll.slotWidthMinutes}-minute slots</span>
      </div>

      {poll.status !== 'draft' && (
        <div className="poll-public-link"><div><span>Participant link</span><code>{publicUrl}</code></div><div className="poll-link-actions"><button type="button" onClick={() => void navigator.clipboard.writeText(publicUrl).then(() => setMessage('Participant link copied.'))}>Copy link</button><button type="button" disabled={busy} onClick={() => void rotateLink()}>Regenerate link</button></div></div>
      )}

      <div className="poll-detail-toolbar">
        {poll.status === 'draft' && <button className="poll-primary-button" type="button" disabled={busy} onClick={() => void changeStatus('open')}>Publish / open</button>}
        {poll.status === 'open' && <button className="poll-secondary-button" type="button" disabled={busy} onClick={() => void changeStatus('closed')}>Close responses</button>}
        {poll.status === 'closed' && <button className="poll-primary-button" type="button" disabled={busy} onClick={() => void changeStatus('open')}>Reopen</button>}
        <button type="button" onClick={() => void downloadAdminPollFile(poll.id, 'pdf', poll.title)}>PDF</button>
        <button type="button" onClick={() => void downloadAdminPollFile(poll.id, 'json', poll.title)}>JSON</button>
        <button type="button" onClick={() => void downloadAdminPollFile(poll.id, 'xml', poll.title)}>XML</button>
      </div>
      {message && <p className="poll-message" role="status">{message}</p>}

      <nav className="poll-detail-tabs" aria-label="Poll detail views">
        <button className={view === 'responses' ? 'is-active' : ''} type="button" onClick={() => setView('responses')}>Responses</button>
        <button className={view === 'intersection' ? 'is-active' : ''} type="button" onClick={() => setView('intersection')}>Intersection analysis</button>
        <button className={view === 'definition' ? 'is-active' : ''} type="button" onClick={() => setView('definition')}>Definition</button>
      </nav>

      {view === 'responses' && (
        <div className="poll-detail-section">
          <div className="poll-participant-status-list">
            {poll.participants.map((participant) => (
              <div key={participant.id} className="poll-participant-status">
                <span className={`poll-participant-dot ${participantColorClass(poll.participants, participant.id)}`} aria-hidden="true">{participantOrdinal(poll.participants, participant.id)}</span>
                <div><strong>{participant.displayName}</strong><span>Participant {participantOrdinal(poll.participants, participant.id)} · {participant.responded ? `Responded${participant.updatedAt ? ` · ${participant.updatedAt}` : ''}` : 'Not responded'}</span></div>
                {participant.responded && <button type="button" disabled={busy} onClick={() => void deleteResponse(participant.id)}>Delete response</button>}
              </div>
            ))}
          </div>
          <AdminResponseGrid poll={poll} />
          <div className="poll-mode-legend"><span>◉ Online</span><span>● In person</span><span>◐ Either</span></div>
        </div>
      )}

      {view === 'intersection' && (
        <div className="poll-detail-section">
          <div className="poll-intersection-controls">
            <button className={filter.kind === 'full' ? 'is-active' : ''} type="button" onClick={() => setFilter({ kind: 'full' })}>100%</button>
            <button className={filter.kind === 'threshold' ? 'is-active' : ''} type="button" onClick={() => setFilter({ kind: 'threshold', percentage: threshold })}>Threshold</button>
            <label>≥ <input type="number" min="0" max="100" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />%</label>
            <button className={filter.kind === 'highest_below_full' ? 'is-active' : ''} type="button" onClick={() => setFilter({ kind: 'highest_below_full' })}>Highest below 100%</button>
            <button className={filter.kind === 'all' ? 'is-active' : ''} type="button" onClick={() => setFilter({ kind: 'all' })}>All slots</button>
          </div>

          <div className="poll-finalize-fields">
            <label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Optional" /></label>
            <label>Meeting link<input type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="Optional" /></label>
            <label>Note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional" /></label>
          </div>

          <div className="poll-intersection-list">
            {filtered.length === 0 && <p>No slots match this filter.</p>}
            {filtered.map((slot) => (
              <article key={`${slot.date}-${slot.startTime}`} className="poll-intersection-row">
                <div><strong>{formatDate(slot.date)}</strong><span>{formatTime(slot.startTime)}–{formatTime(slot.endTime)}</span></div>
                <div className="poll-overlap-score"><strong>{slot.availableCount}/{slot.totalParticipants}</strong><span>{slot.percentage}%</span></div>
                <div className="poll-mode-composition"><span>● {slot.inPersonCount} in person</span><span>◉ {slot.onlineCount} online</span><span>◐ {slot.eitherCount} either</span></div>
                <details><summary>Participants</summary>{slot.participantModes.map((entry) => <span key={entry.participantId}>{entry.displayName} — {modeLabel(entry.mode)}</span>)}</details>
                <button className="poll-primary-button" type="button" disabled={busy} onClick={() => void finalize(slot.date, slot.startTime)}>Finalize</button>
              </article>
            ))}
          </div>
        </div>
      )}

      {view === 'definition' && (
        <div className="poll-detail-section poll-definition-view">
          <p>Canonical JSON representation</p>
          <pre>{pollDefinitionToJson(poll.definition)}</pre>
          <p>XML serialization (same model, not separate storage)</p>
          <pre>{pollDefinitionToXml(poll.definition)}</pre>
        </div>
      )}
    </section>
  );
}
