import { useEffect, useRef } from 'react';
import { formatMilestoneDate } from '../lib/date-utils.ts';
import type { TimelineMilestone } from '../../shared/milestone.ts';

interface MilestoneModalProps {
  milestone: TimelineMilestone | null;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!milestone) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const scrollY = window.scrollY;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    closeButtonRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (!focusable.length) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;

      window.scrollTo(0, scrollY);
      previousActiveElement?.focus({ preventScroll: true });
    };
  }, [milestone, onClose]);

  if (!milestone) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="milestone-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-modal-title"
        aria-describedby="milestone-modal-description"
        tabIndex={-1}
      >
        <button
          ref={closeButtonRef}
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close milestone"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="modal-media" aria-hidden={!milestone.imageSrc}>
          {milestone.imageSrc ? (
            <img src={milestone.imageSrc} alt={milestone.imageAlt} />
          ) : (
            <div className="modal-media-placeholder">
              <span>{milestone.date.year}</span>
              <small>Image slot</small>
            </div>
          )}
        </div>

        <div className="modal-copy">
          <p className="eyebrow">{formatMilestoneDate(milestone.date)}</p>
          <h2 id="milestone-modal-title">{milestone.title}</h2>
          <p id="milestone-modal-description">{milestone.description}</p>
          <a className="text-link" href={`/milestones/${encodeURIComponent(milestone.slug)}`}>
            Read the full story <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
