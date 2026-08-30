import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { KiroAvatarState } from './avatar/kiro-avatar.types.ts';

interface KiroInteractionDemoProps {
  state: KiroAvatarState;
  onStateChange: (state: KiroAvatarState) => void;
}

const STATUS: Record<KiroAvatarState, string> = {
  idle: 'Ready for a question',
  thinking: 'Understanding the request',
  retrieving: 'Searching portfolio context',
  answering: 'Composing the response',
  success: 'Response complete',
  error: 'Unable to complete the request',
};

export default function KiroInteractionDemo({ state, onStateChange }: KiroInteractionDemoProps) {
  const [query, setQuery] = useState('What did you build that best demonstrates systems engineering?');
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const schedule = (next: KiroAvatarState, delay: number) => {
    timers.current.push(window.setTimeout(() => onStateChange(next), delay));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;
    clearTimers();
    onStateChange('thinking');
    schedule('retrieving', 720);
    schedule('answering', 1850);
    schedule('success', 3900);
    schedule('idle', 4850);
  };

  return (
    <form className="kiro-behavior-probe" onSubmit={submit}>
      <div className="kiro-behavior-probe__status" aria-live="polite">
        <span className={`kiro-behavior-probe__dot is-${state}`} aria-hidden="true" />
        <span>{STATUS[state]}</span>
      </div>
      <label className="kiro-behavior-probe__field">
        <span>Behavior test</span>
        <div>
          <input
            value={query}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            placeholder="Ask Kiro something"
            aria-label="Behavior test query"
          />
          <button type="submit">Run</button>
        </div>
      </label>
      <p>
        This drives the same state interface the RAG flow will use. Pointer movement drives gaze; transitions are spring-smoothed rather than DOM transforms.
      </p>
    </form>
  );
}
