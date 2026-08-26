import { formatMilestoneDate } from '../lib/date-utils.ts';
import type { MilestoneDetail } from '../../shared/milestone.ts';

interface MilestoneDetailPageProps {
  milestone: MilestoneDetail | null;
}

function renderParagraphs(markdown: string) {
  return markdown
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>);
}

export default function MilestoneDetailPage({ milestone }: MilestoneDetailPageProps) {
  if (!milestone) {
    return (
      <main className="detail-page detail-page--missing">
        <a className="back-link" href="/">← Back to timeline</a>
        <p className="eyebrow">Milestone</p>
        <h1>Story not found.</h1>
        <p>The requested milestone does not exist in the published timeline.</p>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <a className="back-link" href="/">← Back to timeline</a>

      <header className="detail-header">
        <p className="eyebrow">{formatMilestoneDate(milestone.date)}</p>
        <h1>{milestone.title}</h1>
        <p className="detail-lead">{milestone.description}</p>
      </header>

      <div className="detail-media">
        {milestone.imageSrc ? (
          <img src={milestone.imageSrc} alt={milestone.imageAlt} />
        ) : (
          <div className="detail-media-placeholder">
            <span>{milestone.date.year}</span>
            <small>Milestone photography</small>
          </div>
        )}
      </div>

      <section className="detail-body" aria-label="Milestone story">
        {milestone.detailMarkdown && renderParagraphs(milestone.detailMarkdown)}
        {milestone.sections.map((section) => (
          <section key={section.id}>
            {section.heading && <h2>{section.heading}</h2>}
            {renderParagraphs(section.bodyMarkdown)}
          </section>
        ))}
      </section>
    </main>
  );
}
