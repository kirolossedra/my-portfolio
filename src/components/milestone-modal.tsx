import { useEffect, useRef, type MouseEvent } from 'react';
import { formatMilestoneDate } from '../lib/date-utils.ts';
import type { TimelineMilestone } from '../../shared/milestone.ts';

interface MilestoneModalProps {
  milestone: TimelineMilestone | null;
  onClose: () => void;
}

export default function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!milestone) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [milestone, onClose]);

  if (!milestone) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="milestone-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-modal-title"
        onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
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
          <p>{milestone.description}</p>
          <a className="text-link" href={`/milestones/${encodeURIComponent(milestone.slug)}`}>
            Read the full story <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
