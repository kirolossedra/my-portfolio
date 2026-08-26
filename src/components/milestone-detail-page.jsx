import { formatMilestoneDate } from '../lib/date-utils';

export default function MilestoneDetailPage({ milestone }) {
  if (!milestone) {
    return (
      <main className="detail-page detail-page--missing">
        <a className="back-link" href="/">
          ← Back to timeline
        </a>
        <p className="eyebrow">Milestone</p>
        <h1>Story not found.</h1>
        <p>The requested milestone does not exist in the current timeline data.</p>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <a className="back-link" href="/">
        ← Back to timeline
      </a>

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
            <small>Replace with milestone photography</small>
          </div>
        )}
      </div>

      <section className="detail-body" aria-label="Milestone story">
        {milestone.detailParagraphs?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
    </main>
  );
}
