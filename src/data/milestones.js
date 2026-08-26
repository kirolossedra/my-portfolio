/**
 * Reusable milestone schema.
 *
 * Required:
 * - id: stable unique key
 * - slug: used by /milestones/:slug
 * - date: { year, month } where month is 1-12
 * - title: short milestone title shown on the timeline
 * - summary: compact timeline description
 * - description: expanded modal description
 *
 * Optional:
 * - imageSrc / imageAlt: displayed in the modal and detail page
 * - detailParagraphs: longer narrative used by the dedicated detail page
 *
 * These first entries are template content. Replace them with real milestones
 * before treating the timeline as a biographical record.
 */
export const milestones = [
  {
    id: 'template-origin',
    slug: 'template-origin',
    date: { year: 2018, month: 9 },
    title: 'Your first milestone',
    summary: 'Establish the beginning of the story with one precise event.',
    description:
      'Use this expanded space for the human context behind the milestone: what changed, what you learned, and why it mattered.',
    imageSrc: null,
    imageAlt: '',
    detailParagraphs: [
      'This dedicated page is generated from the same milestone data that powers the landing-page timeline.',
      'Replace this template copy with the complete story, supporting links, artifacts, images, or evidence that make the milestone worth exploring.',
    ],
  },
  {
    id: 'template-transition',
    slug: 'template-transition',
    date: { year: 2021, month: 1 },
    title: 'A meaningful transition',
    summary: 'Show the next chapter without turning the timeline into a résumé list.',
    description:
      'Milestones should represent actual changes in direction, responsibility, capability, or perspective—not every task completed along the way.',
    imageSrc: null,
    imageAlt: '',
    detailParagraphs: [
      'The timeline is intentionally selective. A good entry explains a genuine transition rather than optimizing for the largest possible number of achievements.',
      'Use this page for the deeper context that would make the event understandable to someone who was not there.',
    ],
  },
  {
    id: 'template-new-chapter',
    slug: 'template-new-chapter',
    date: { year: 2024, month: 9 },
    title: 'A new chapter',
    summary: 'A later event appears farther down because more real time has passed.',
    description:
      'The dots use calendar months as their spatial scale. Longer historical gaps therefore become visibly longer gaps on the page.',
    imageSrc: null,
    imageAlt: '',
    detailParagraphs: [
      'The vertical position is calculated directly from year and month. The timeline is not evenly spaced by item count.',
      'That means the visual rhythm preserves chronology instead of making six months look equivalent to six years.',
    ],
  },
  {
    id: 'portfolio-foundation',
    slug: 'portfolio-foundation',
    date: { year: 2026, month: 8 },
    title: 'kirolos.dev begins',
    summary: 'The portfolio moves from a temporary welcome page into a reusable React system.',
    description:
      'This milestone marks the foundation of a portfolio designed to grow incrementally: history, projects, research, languages, soft skills, and first-hand perspectives can become independent sections without rebuilding the core.',
    imageSrc: null,
    imageAlt: '',
    detailParagraphs: [
      'The first React feature is a time-proportional life timeline. Each event is driven by structured data and can open both an expanded modal and a dedicated detail page.',
      'The design deliberately keeps motion, decoration, and visual noise restrained so that the underlying work and narrative remain the focal point.',
    ],
  },
];
