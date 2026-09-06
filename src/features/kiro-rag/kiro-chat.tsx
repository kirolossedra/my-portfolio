import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { RagCitation } from '../../../shared/rag.ts';
import KiroGlbAvatar from './model3d/kiro-glb-avatar.tsx';
import type { KiroAvatarState } from './model3d/kiro-model.types.ts';
import {
  streamRagQuery,
  type RagStreamContextPayload,
  type RagStreamDonePayload,
} from './rag-client.ts';
import './kiro-chat.css';

type TurnStatus = 'retrieving' | 'answering' | 'complete' | 'error' | 'stopped';

interface ChatTurn {
  id: string;
  question: string;
  answer: string;
  status: TurnStatus;
  citations: RagCitation[];
  retrieval: RagStreamContextPayload['retrieval'] | null;
  models: RagStreamContextPayload['models'] | null;
  citedEvidenceLabels: string[];
  groundingWarning: string | null;
  error: string | null;
}

const SUGGESTIONS = [
  'Which projects show the strongest backend engineering?',
  'How did my testing discipline evolve over time?',
  'Which projects show product ownership beyond coding?',
  'Where is the portfolio evidence weakest?',
] as const;

function makeTurnId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function humanize(value: string) {
  return value.replace(/_/g, ' ');
}

function inlineAnswer(text: string, turn: ChatTurn): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[E\d+\])/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    if (/^\[E\d+\]$/.test(part)) {
      const label = part.slice(1, -1);
      const exists = turn.citations.some((citation) => citation.label === label);
      const sourceId = `kiro-source-${turn.id}-${label}`;
      if (exists) {
        return (
          <a
            key={`${part}-${index}`}
            className="kiro-citation-ref"
            href={`#${sourceId}`}
            aria-label={`Jump to source ${label}`}
            onClick={(event) => {
              event.preventDefault();
              const target = document.getElementById(sourceId);
              const details = target?.closest('details');
              if (details instanceof HTMLDetailsElement) details.open = true;
              target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            {part}
          </a>
        );
      }
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function AnswerBody({ turn }: { turn: ChatTurn }) {
  const lines = turn.answer.split('\n');
  return (
    <div className="kiro-answer-copy">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <span key={`gap-${index}`} className="kiro-answer-gap" aria-hidden="true" />;

        const heading = trimmed.match(/^#{1,3}\s+(.*)$/);
        if (heading) {
          return <h3 key={`heading-${index}`}>{inlineAnswer(heading[1] ?? '', turn)}</h3>;
        }

        const bullet = trimmed.match(/^[-*]\s+(.*)$/);
        if (bullet) {
          return (
            <div key={`bullet-${index}`} className="kiro-answer-bullet">
              <span aria-hidden="true">•</span>
              <p>{inlineAnswer(bullet[1] ?? '', turn)}</p>
            </div>
          );
        }

        return <p key={`line-${index}`}>{inlineAnswer(line, turn)}</p>;
      })}
    </div>
  );
}

function AgentProgress({ status }: { status: TurnStatus }) {
  const copy = status === 'retrieving'
    ? 'Searching portfolio evidence'
    : status === 'answering'
      ? 'Writing from grounded evidence'
      : status === 'stopped'
        ? 'Generation stopped'
        : status === 'error'
          ? 'Request failed'
          : 'Response complete';

  return (
    <div className={`kiro-agent-progress is-${status}`} role="status" aria-live="polite">
      <span className="kiro-agent-progress__orb" aria-hidden="true" />
      <span>{copy}</span>
      {(status === 'retrieving' || status === 'answering') && (
        <span className="kiro-agent-progress__dots" aria-hidden="true"><i /><i /><i /></span>
      )}
    </div>
  );
}

function ActivityPanel({ turn }: { turn: ChatTurn }) {
  if (!turn.retrieval) return null;
  return (
    <details className="kiro-agent-activity">
      <summary>How Kiro answered</summary>
      <div className="kiro-agent-activity__steps">
        <span><strong>{turn.retrieval.vectorCandidates}</strong> retrieved</span>
        <b aria-hidden="true">→</b>
        <span><strong>{turn.retrieval.rerankedDocuments}</strong> reranked</span>
        <b aria-hidden="true">→</b>
        <span><strong>{turn.retrieval.selectedEvidence}</strong> evidence notes</span>
      </div>
      {turn.models && (
        <p>
          Qwen3 embedding → BGE reranking → GLM answer generation. Each question is grounded independently against the portfolio corpus.
        </p>
      )}
    </details>
  );
}

function SourcesPanel({ turn }: { turn: ChatTurn }) {
  if (turn.citations.length === 0) return null;
  const cited = new Set(turn.citedEvidenceLabels);
  const ordered = [...turn.citations].sort((a, b) => Number(cited.has(b.label)) - Number(cited.has(a.label)));

  return (
    <details className="kiro-agent-sources">
      <summary>
        <span>Sources</span>
        <small>{cited.size} cited · {turn.citations.length} considered</small>
      </summary>
      <div className="kiro-agent-sources__grid">
        {ordered.map((citation) => {
          const fragment = citation.sourceFragments[0];
          const used = cited.has(citation.label);
          return (
            <article
              key={citation.label}
              id={`kiro-source-${turn.id}-${citation.label}`}
              className={used ? 'is-cited' : 'is-considered'}
            >
              <div className="kiro-source-card__topline">
                <span>{citation.label}</span>
                <em>{used ? 'Cited' : 'Considered'}</em>
              </div>
              <h4>{citation.repositoryName}</h4>
              <p>{humanize(citation.semanticArea)} · {humanize(citation.evidenceLevel)}</p>
              {fragment?.section_title && <small>{fragment.section_title}</small>}
              {typeof fragment?.source_line_start === 'number' && (
                <small>
                  Analysis lines {fragment.source_line_start}
                  {typeof fragment.source_line_end === 'number' && fragment.source_line_end !== fragment.source_line_start
                    ? `–${fragment.source_line_end}`
                    : ''}
                </small>
              )}
              {citation.repositoryUrl && (
                <a href={citation.repositoryUrl} target="_blank" rel="noreferrer">Open repository ↗</a>
              )}
            </article>
          );
        })}
      </div>
    </details>
  );
}

function TurnView({ turn, onRetry }: { turn: ChatTurn; onRetry: (turn: ChatTurn) => void }) {
  const hasAnswer = Boolean(turn.answer);

  const copyAnswer = () => {
    if (!turn.answer || !navigator.clipboard) return;
    void navigator.clipboard.writeText(turn.answer).catch(() => undefined);
  };

  return (
    <article className="kiro-chat-turn">
      <div className="kiro-user-message">
        <span>You</span>
        <p>{turn.question}</p>
      </div>

      <div className="kiro-assistant-message">
        <div className="kiro-assistant-message__identity">
          <span className="kiro-assistant-mark" aria-hidden="true">K</span>
          <strong>Kiro</strong>
        </div>

        {!hasAnswer && (turn.status === 'retrieving' || turn.status === 'answering') && (
          <AgentProgress status={turn.status} />
        )}

        {hasAnswer && (
          <div className="kiro-assistant-message__answer">
            <AnswerBody turn={turn} />
            {turn.status === 'answering' && <span className="kiro-stream-cursor" aria-hidden="true" />}
          </div>
        )}

        {turn.status === 'error' && (
          <div className="kiro-turn-error" role="alert">
            <p>{turn.error ?? 'The portfolio agent could not complete this request.'}</p>
            <button type="button" onClick={() => onRetry(turn)}>Try again</button>
          </div>
        )}

        {turn.status === 'stopped' && (
          <div className="kiro-turn-stopped">
            <span>Stopped</span>
            <button type="button" onClick={() => onRetry(turn)}>Regenerate</button>
          </div>
        )}

        {turn.groundingWarning && <p className="kiro-grounding-warning">{turn.groundingWarning}</p>}

        {hasAnswer && turn.status !== 'answering' && (
          <div className="kiro-message-actions">
            <button type="button" onClick={copyAnswer}>Copy</button>
          </div>
        )}

        <SourcesPanel turn={turn} />
        <ActivityPanel turn={turn} />
      </div>
    </article>
  );
}

const AVATAR_STATUS: Record<KiroAvatarState, string> = {
  idle: 'Ready for a question',
  thinking: 'Understanding your question',
  retrieving: 'Searching 2,808 evidence notes',
  answering: 'Writing the grounded answer',
  success: 'Answer complete',
  error: 'Something interrupted the request',
};

export default function KiroChat() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<KiroAvatarState>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const isRunning = activeTurnId !== null;
  const canSend = !isRunning && draft.trim().length >= 3;

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    if (!stickToBottomRef.current || !threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [turns, activeTurnId]);

  const updateTurn = (id: string, updater: (turn: ChatTurn) => ChatTurn) => {
    setTurns((current) => current.map((turn) => turn.id === id ? updater(turn) : turn));
  };

  const runTurn = async (id: string, question: string) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setActiveTurnId(id);
    setAvatarState('retrieving');

    try {
      await streamRagQuery(question, {
        onContext: (context: RagStreamContextPayload) => {
          setAvatarState('answering');
          updateTurn(id, (turn) => ({
            ...turn,
            status: 'answering',
            citations: context.citations,
            retrieval: context.retrieval,
            models: context.models,
          }));
        },
        onToken: (text: string) => {
          setAvatarState('answering');
          updateTurn(id, (turn) => ({ ...turn, status: 'answering', answer: turn.answer + text }));
        },
        onDone: (done: RagStreamDonePayload) => {
          setAvatarState('success');
          updateTurn(id, (turn) => ({
            ...turn,
            status: 'complete',
            citedEvidenceLabels: done.citedEvidenceLabels,
            groundingWarning: done.groundingWarning,
          }));
        },
      }, controller.signal);

      updateTurn(id, (turn) => ({ ...turn, status: 'complete' }));
      setAvatarState('success');
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      if (aborted) {
        updateTurn(id, (turn) => ({ ...turn, status: 'stopped', error: null }));
        setAvatarState('idle');
      } else {
        const message = error instanceof Error ? error.message : 'The portfolio agent could not complete this request.';
        updateTurn(id, (turn) => ({ ...turn, status: 'error', error: message }));
        setAvatarState('error');
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setActiveTurnId(null);
      }
    }
  };

  const startNewTurn = (question: string) => {
    const trimmed = question.trim();
    if (trimmed.length < 3 || isRunning) return;
    const id = makeTurnId();
    const turn: ChatTurn = {
      id,
      question: trimmed,
      answer: '',
      status: 'retrieving',
      citations: [],
      retrieval: null,
      models: null,
      citedEvidenceLabels: [],
      groundingWarning: null,
      error: null,
    };
    stickToBottomRef.current = true;
    setTurns((current) => [...current, turn]);
    setDraft('');
    void runTurn(id, trimmed);
  };

  const retryTurn = (turn: ChatTurn) => {
    if (isRunning) return;
    updateTurn(turn.id, (current) => ({
      ...current,
      answer: '',
      status: 'retrieving',
      citations: [],
      retrieval: null,
      models: null,
      citedEvidenceLabels: [],
      groundingWarning: null,
      error: null,
    }));
    void runTurn(turn.id, turn.question);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) startNewTurn(draft);
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    if (canSend) startNewTurn(draft);
  };

  const stop = () => controllerRef.current?.abort();

  const clearChat = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setActiveTurnId(null);
    setTurns([]);
    setDraft('');
    setAvatarState('idle');
    stickToBottomRef.current = true;
  };

  const onThreadScroll = () => {
    const node = threadRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 140;
  };

  return (
    <div className="kiro-agent-workspace">
      <section className="kiro-agent-chat" aria-label="Kiro portfolio agent chat">
        <header className="kiro-agent-chat__header">
          <div>
            <span className="kiro-agent-kicker">Portfolio intelligence</span>
            <h1>Kiro</h1>
            <p>Ask about projects, skills, engineering growth, tradeoffs, testing, ownership, and gaps.</p>
          </div>
          <button type="button" className="kiro-new-chat" onClick={clearChat} disabled={turns.length === 0 && !isRunning}>
            New chat
          </button>
        </header>

        <div ref={threadRef} className="kiro-chat-thread" onScroll={onThreadScroll}>
          {turns.length === 0 ? (
            <div className="kiro-chat-empty">
              <span className="kiro-chat-empty__mark" aria-hidden="true">K</span>
              <h2>Ask the portfolio, not a résumé.</h2>
              <p>
                Kiro searches 2,808 evidence-aware notes across 134 repositories, reranks the strongest context, then writes a cited answer.
              </p>
              <div className="kiro-suggestion-grid" aria-label="Suggested questions">
                {SUGGESTIONS.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => startNewTurn(suggestion)}>
                    <span>{suggestion}</span>
                    <b aria-hidden="true">↗</b>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="kiro-chat-turns">
              {turns.map((turn) => <TurnView key={turn.id} turn={turn} onRetry={retryTurn} />)}
            </div>
          )}
        </div>

        <form className="kiro-agent-composer" onSubmit={submit}>
          <div className="kiro-agent-composer__box">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onComposerKeyDown}
              rows={1}
              maxLength={1600}
              placeholder="Ask Kiro about the portfolio…"
              aria-label="Ask Kiro about the portfolio"
            />
            <div className="kiro-agent-composer__actions">
              <span>{isRunning ? 'Kiro is working' : 'Enter to send · Shift+Enter for a new line'}</span>
              {isRunning ? (
                <button type="button" className="kiro-stop-button" onClick={stop} aria-label="Stop Kiro response">
                  <i aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className="kiro-send-button" disabled={!canSend} aria-label="Send question to Kiro">
                  <span aria-hidden="true">↑</span>
                </button>
              )}
            </div>
          </div>
          <p>Each answer is grounded independently to portfolio evidence. Chat history stays in this browser session only.</p>
        </form>
      </section>

      <aside className="kiro-agent-presence" aria-label="Kiro agent presence">
        <div className="kiro-agent-avatar">
          <KiroGlbAvatar
            state={avatarState}
            talking={avatarState === 'answering'}
            interactiveGaze
            className="kiro-agent-avatar__model"
          />
          <div className="kiro-agent-avatar__glow" aria-hidden="true" />
        </div>
        <div className="kiro-agent-presence__copy">
          <div className="kiro-agent-live">
            <span aria-hidden="true" />
            <strong>Live portfolio agent</strong>
          </div>
          <h2>Kiro is evidence-bound.</h2>
          <p aria-live="polite">{AVATAR_STATUS[avatarState]}</p>
          <div className="kiro-agent-stats">
            <span><strong>134</strong> repositories</span>
            <span><strong>2,808</strong> evidence notes</span>
            <span><strong>E#</strong> grounded citations</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
