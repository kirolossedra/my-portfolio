import { useState } from 'react';
import type { AdminPollDetail, PollDefinition } from '../../shared/poll.ts';
import { POLL_TIMEZONE, pollDefinitionToJson, pollDefinitionToXml, validatePollDefinition } from '../../shared/poll.ts';
import { createPoll, updatePoll, updatePollStatus } from './api.ts';
import { parsePollXml } from './xml.ts';
import { builderToDefinition, definitionToBuilder, emptyBuilder, formatDate, type BuilderModel, type CreateMethod } from './admin-poll-utils.ts';
import { PollPreview } from './admin-response-grid.tsx';
import StructuredPollEditor from './structured-poll-editor.tsx';

export default function PollBuilder({
  editing,
  onSaved,
  onCancel,
}: {
  editing: AdminPollDetail | null;
  onSaved: (poll: AdminPollDetail) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<CreateMethod>('gui');
  const [builder, setBuilder] = useState<BuilderModel>(() => editing ? definitionToBuilder(editing.definition) : emptyBuilder());
  const [dateInput, setDateInput] = useState('');
  const [structuredFormat, setStructuredFormat] = useState<'json' | 'xml'>('json');
  const [structuredText, setStructuredText] = useState(() => editing ? pollDefinitionToJson(editing.definition) : '');
  const [preview, setPreview] = useState<PollDefinition | null>(editing?.definition ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const deriveDefinition = (): PollDefinition => {
    if (method === 'gui') return builderToDefinition(builder);
    if (structuredFormat === 'json') return validatePollDefinition(JSON.parse(structuredText) as unknown);
    return parsePollXml(structuredText);
  };

  const validatePreview = () => {
    try {
      const definition = deriveDefinition();
      setPreview(definition);
      setMessage('Definition validated. Preview reflects the canonical model.');
    } catch (error) {
      setPreview(null);
      setMessage(error instanceof Error ? error.message : 'Definition is invalid.');
    }
  };

  const save = async (publish: boolean) => {
    setBusy(true);
    setMessage('');
    try {
      const definition = deriveDefinition();
      let saved = editing ? await updatePoll(editing.id, definition) : await createPoll(definition);
      if (publish && saved.status === 'draft') saved = await updatePollStatus(saved.id, 'open');
      onSaved(saved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Poll could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const switchStructuredFormat = (format: 'json' | 'xml') => {
    if (format === structuredFormat) return;
    if (!structuredText.trim()) {
      setStructuredFormat(format);
      return;
    }
    try {
      const definition = structuredFormat === 'json'
        ? validatePollDefinition(JSON.parse(structuredText) as unknown)
        : parsePollXml(structuredText);
      setStructuredFormat(format);
      setStructuredText(format === 'json' ? pollDefinitionToJson(definition) : pollDefinitionToXml(definition));
      setMessage('Definition converted without changing the poll model.');
    } catch {
      setStructuredFormat(format);
      setMessage('Format switched, but the current text is not valid enough to convert. Your text was preserved.');
    }
  };

  return (
    <section className="poll-admin-builder">
      <div className="poll-section-heading">
        <div><p className="eyebrow">{editing ? 'Edit poll' : 'Create poll'}</p><h1>{editing ? editing.title : 'New availability poll'}</h1></div>
        <button className="poll-text-button" type="button" onClick={onCancel}>Cancel</button>
      </div>
      <div className="poll-method-switch" role="tablist" aria-label="Poll definition method">
        <button type="button" className={method === 'gui' ? 'is-active' : ''} onClick={() => setMethod('gui')}>Build with GUI</button>
        <button type="button" className={method === 'structured' ? 'is-active' : ''} onClick={() => setMethod('structured')}>Paste JSON / XML</button>
      </div>

      {method === 'gui' ? (
        <div className="poll-builder-fields">
          <label>Poll title<input value={builder.title} maxLength={160} onChange={(event) => setBuilder({ ...builder, title: event.target.value })} /></label>
          <label>Description<textarea rows={4} maxLength={4000} value={builder.description} onChange={(event) => setBuilder({ ...builder, description: event.target.value })} /></label>
          <label className="poll-wide-field">Expected participants <span>one name per line</span><textarea rows={6} value={builder.participantsText} onChange={(event) => setBuilder({ ...builder, participantsText: event.target.value })} /></label>

          <div className="poll-builder-group poll-wide-field">
            <div><strong>Selected dates</strong><span>Arbitrary days; no continuous range required.</span></div>
            <div className="poll-date-adder">
              <input type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
              <button type="button" onClick={() => {
                if (!dateInput || builder.dates.includes(dateInput)) return;
                setBuilder({ ...builder, dates: [...builder.dates, dateInput].sort() });
                setDateInput('');
              }}>Add date</button>
            </div>
            <div className="poll-date-chips">
              {builder.dates.map((date) => <button type="button" key={date} onClick={() => setBuilder({ ...builder, dates: builder.dates.filter((item) => item !== date) })}>{formatDate(date)} <span aria-hidden="true">×</span><span className="sr-only">remove</span></button>)}
            </div>
          </div>

          <div className="poll-builder-group poll-wide-field">
            <div><strong>Time ranges</strong><span>Applied to every selected date.</span></div>
            {[{ startTime: builder.startTime, endTime: builder.endTime }, ...builder.extraRanges].map((range, index) => (
              <div className="poll-time-range-row" key={`range-${index}`}>
                <label>Start<input type="time" value={range.startTime} onChange={(event) => {
                  if (index === 0) setBuilder({ ...builder, startTime: event.target.value });
                  else setBuilder({ ...builder, extraRanges: builder.extraRanges.map((item, itemIndex) => itemIndex === index - 1 ? { ...item, startTime: event.target.value } : item) });
                }} /></label>
                <span>→</span>
                <label>End<input type="time" value={range.endTime} onChange={(event) => {
                  if (index === 0) setBuilder({ ...builder, endTime: event.target.value });
                  else setBuilder({ ...builder, extraRanges: builder.extraRanges.map((item, itemIndex) => itemIndex === index - 1 ? { ...item, endTime: event.target.value } : item) });
                }} /></label>
                {index > 0 && <button type="button" onClick={() => setBuilder({ ...builder, extraRanges: builder.extraRanges.filter((_, itemIndex) => itemIndex !== index - 1) })}>Remove</button>}
              </div>
            ))}
            <button className="poll-secondary-button" type="button" onClick={() => setBuilder({ ...builder, extraRanges: [...builder.extraRanges, { startTime: '09:00', endTime: '17:00' }] })}>Add time range</button>
          </div>

          <label>Global slot width
            <select value={builder.slotWidthMinutes} onChange={(event) => setBuilder({ ...builder, slotWidthMinutes: Number(event.target.value) })}>
              {[15, 30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
            </select>
          </label>
        </div>
      ) : (
        <StructuredPollEditor
          format={structuredFormat}
          text={structuredText}
          onFormatChange={setStructuredFormat}
          onTextChange={setStructuredText}
          onSwitchFormat={switchStructuredFormat}
        />
      )}

      <div className="poll-builder-actions">
        <button className="poll-secondary-button" type="button" onClick={validatePreview}>Validate & preview</button>
        <button className="poll-secondary-button" type="button" disabled={busy} onClick={() => void save(false)}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Save draft'}</button>
        {!editing && <button className="poll-primary-button" type="button" disabled={busy} onClick={() => void save(true)}>{busy ? 'Publishing…' : 'Publish poll'}</button>}
      </div>
      {message && <p className="poll-message" role="status">{message}</p>}
      {preview && <PollPreview definition={preview} />}
    </section>
  );
}
