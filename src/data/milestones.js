const MILESTONES_URL = '/content/milestones.json';

function isValidMonth(month) {
  return Number.isInteger(month) && month >= 1 && month <= 12;
}

function validateMilestone(milestone, index) {
  const prefix = `Milestone ${index + 1}`;

  if (!milestone || typeof milestone !== 'object') {
    throw new Error(`${prefix} must be an object.`);
  }

  if (!milestone.id || !milestone.slug || !milestone.title) {
    throw new Error(`${prefix} requires id, slug, and title.`);
  }

  if (!milestone.date || !Number.isInteger(milestone.date.year) || !isValidMonth(milestone.date.month)) {
    throw new Error(`${prefix} requires a valid date with integer year and month 1-12.`);
  }

  return {
    ...milestone,
    summary: milestone.summary ?? '',
    description: milestone.description ?? '',
    imageSrc: milestone.imageSrc ?? null,
    imageAlt: milestone.imageAlt ?? '',
    detailParagraphs: Array.isArray(milestone.detailParagraphs)
      ? milestone.detailParagraphs
      : [],
  };
}

/**
 * Timeline content lives outside React in /public/content/milestones.json.
 * Add, remove, or reorder milestones there without changing component code.
 */
export async function loadMilestones() {
  const response = await fetch(MILESTONES_URL, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Could not load timeline content (${response.status}).`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Timeline content must be a JSON array.');
  }

  const milestones = data.map(validateMilestone);
  const ids = new Set();
  const slugs = new Set();

  milestones.forEach((milestone) => {
    if (ids.has(milestone.id)) {
      throw new Error(`Duplicate milestone id: ${milestone.id}`);
    }
    if (slugs.has(milestone.slug)) {
      throw new Error(`Duplicate milestone slug: ${milestone.slug}`);
    }
    ids.add(milestone.id);
    slugs.add(milestone.slug);
  });

  return milestones;
}
