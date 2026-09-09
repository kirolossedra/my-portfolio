import { useMemo, useState } from 'react';
import { validatePollDefinition } from '../../shared/poll.ts';
import { parsePollXml } from './xml.ts';

type StructuredFormat = 'json' | 'xml';

function detectFormat(text: string, fallback: StructuredFormat): StructuredFormat {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<')) return 'xml';
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return fallback;
}

function parseDefinition(text: string, format: StructuredFormat) {
  if (!text.trim()) throw new Error('Paste or enter a poll definition first.');
  return format === 'json'
    ? validatePollDefinition(JSON.parse(text) as unknown)
    : parsePollXml(text);
}

export default function StructuredPollEditor({
  format,
  text,
  onFormatChange,
  onTextChange,
  onSwitchFormat,
}: {
  format: StructuredFormat;
  text: string;
  onFormatChange: (format: StructuredFormat) => void;
  onTextChange: (text: string) => void;
  onSwitchFormat: (format: StructuredFormat) => void;
}) {
  const [clipboardMessage, setClipboardMessage] = useState('');
  const validation = useMemo(() => {
    if (!text.trim()) return { valid: false as const, empty: true as const, message: 'Paste JSON or XML below. The format is detected automatically.' };
    try {
      const definition = parseDefinition(text, format);
      return {
        valid: true as const,
        empty: false as const,
        definition,
        message: `${definition.participantNames.length} participants · ${definition.dates.length} dates · ${definition.slotWidthMinutes}-minute slots`,
      };
    } catch (error) {
      return {
        valid: false as const,
        empty: false as const,
        message: error instanceof Error ? error.message : 'Definition is invalid.',
      };
    }
  }, [format, text]);

  const ingest = (incoming: string) => {
    const detected = detectFormat(incoming, format);
    if (detected !== format) onFormatChange(detected);
    onTextChange(incoming);
    setClipboardMessage('');
  };

  const pasteFromClipboard = async () => {
    try {
      const incoming = await navigator.clipboard.readText();
      if (!incoming.trim()) {
        setClipboardMessage('Clipboard is empty.');
        return;
      }
      ingest(incoming);
      setClipboardMessage('Pasted from clipboard.');
    } catch {
      setClipboardMessage('Clipboard access was blocked. Tap the editor and paste normally.');
    }
  };

  return (
    <div className="poll-structured-editor">
      <div className="poll-structured-toolbar">
        <div className="poll-format-switch" role="tablist" aria-label="Structured definition format">
          <button type="button" className={format === 'json' ? 'is-active' : ''} onClick={() => onSwitchFormat('json')}>JSON</button>
          <button type="button" className={format === 'xml' ? 'is-active' : ''} onClick={() => onSwitchFormat('xml')}>XML</button>
        </div>
        <div className="poll-structured-actions">
          <button className="poll-secondary-button" type="button" onClick={() => void pasteFromClipboard()}>Paste from clipboard</button>
          <button className="poll-text-button" type="button" disabled={!text} onClick={() => ingest('')}>Clear</button>
        </div>
      </div>

      <div className={`poll-structured-dropzone${validation.valid ? ' is-valid' : validation.empty ? '' : ' is-invalid'}`}>
        <div className="poll-structured-hint">
          <strong>Paste a complete JSON or XML poll definition</strong>
          <span>No file conversion step is needed. XML and JSON map to the same canonical poll model.</span>
        </div>
        <textarea
          spellCheck={false}
          value={text}
          placeholder={'Paste here…\n\n<?xml version="1.0" encoding="UTF-8"?>\n<poll schemaVersion="1">…</poll>'}
          onChange={(event) => ingest(event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text');
            if (!pasted) return;
            event.preventDefault();
            ingest(pasted);
          }}
          aria-label={`${format.toUpperCase()} poll definition`}
        />
      </div>

      <div className={`poll-structured-validation${validation.valid ? ' is-valid' : validation.empty ? '' : ' is-invalid'}`} role="status">
        <strong>{validation.valid ? '✓ Definition valid' : validation.empty ? 'Ready to paste' : 'Needs attention'}</strong>
        <span>{validation.message}</span>
        {validation.valid && <span className="poll-structured-title">{validation.definition.title}</span>}
      </div>
      {clipboardMessage && <p className="poll-structured-clipboard-message">{clipboardMessage}</p>}
    </div>
  );
}
