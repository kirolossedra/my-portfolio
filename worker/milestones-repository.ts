import type {
  AdminMilestoneSummary,
  MilestoneDetail,
  MilestoneImage,
  MilestoneImageWriteInput,
  MilestoneSection,
  MilestoneSectionWriteInput,
  MilestoneWriteInput,
  TimelineMilestone,
} from '../shared/milestone.ts';
import { HttpError } from './http.ts';
import { base64ByteSize } from './validation.ts';

interface MilestoneRow {
  id: number;
  slug: string;
  year: number;
  month: number;
  title: string;
  short_description: string;
  expanded_description: string | null;
  detail_markdown: string | null;
  display_order: number;
  is_published: number;
  published_at: string | null;
  cover_image_id: number | null;
  cover_alt_text: string | null;
}

interface MilestoneImageRow {
  id: number;
  mime_type: string;
  byte_size: number;
  alt_text: string;
  caption: string | null;
  display_order: number;
  is_cover: number;
}

interface MilestoneImageContentRow {
  id: number;
  mime_type: string;
  base64_data: string;
  byte_size: number;
}

interface MilestoneSectionRow {
  id: number;
  heading: string | null;
  body_markdown: string;
  display_order: number;
}

const SELECT_MILESTONE_COLUMNS = `
  SELECT
    m.id,
    m.slug,
    m.year,
    m.month,
    m.title,
    m.short_description,
    m.expanded_description,
    m.detail_markdown,
    m.display_order,
    m.is_published,
    m.published_at,
    cover.id AS cover_image_id,
    cover.alt_text AS cover_alt_text
  FROM milestones m
  LEFT JOIN milestone_images cover
    ON cover.id = (
      SELECT image.id
      FROM milestone_images image
      WHERE image.milestone_id = m.id
      ORDER BY image.is_cover DESC, image.display_order ASC, image.id ASC
      LIMIT 1
    )
`;

function imageUrl(origin: string, imageId: number | null): string | null {
  return imageId ? `${origin}/api/images/${imageId}` : null;
}

function toTimelineMilestone(row: MilestoneRow, origin: string): TimelineMilestone {
  return {
    id: row.id,
    slug: row.slug,
    date: {
      year: row.year,
      month: row.month,
    },
    title: row.title,
    summary: row.short_description,
    description: row.expanded_description ?? row.short_description,
    imageSrc: imageUrl(origin, row.cover_image_id),
    imageAlt: row.cover_alt_text ?? '',
  };
}

function toAdminMilestone(row: MilestoneRow, origin: string): AdminMilestoneSummary {
  return {
    ...toTimelineMilestone(row, origin),
    displayOrder: row.display_order,
    isPublished: row.is_published === 1,
    publishedAt: row.published_at,
  };
}

function toImage(row: MilestoneImageRow, origin: string): MilestoneImage {
  return {
    id: row.id,
    imageSrc: `${origin}/api/images/${row.id}`,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    altText: row.alt_text,
    caption: row.caption,
    displayOrder: row.display_order,
    isCover: row.is_cover === 1,
  };
}

function toSection(row: MilestoneSectionRow): MilestoneSection {
  return {
    id: row.id,
    heading: row.heading,
    bodyMarkdown: row.body_markdown,
    displayOrder: row.display_order,
  };
}

async function milestoneExists(db: D1Database, milestoneId: number): Promise<void> {
  const row = await db
    .prepare('SELECT id FROM milestones WHERE id = ?1')
    .bind(milestoneId)
    .first<{ id: number }>();
  if (!row) {
    throw new HttpError(404, 'milestone_not_found', 'Milestone does not exist.');
  }
}

async function imageExistsForMilestone(
  db: D1Database,
  milestoneId: number,
  imageId: number,
): Promise<void> {
  const row = await db
    .prepare('SELECT id FROM milestone_images WHERE id = ?1 AND milestone_id = ?2')
    .bind(imageId, milestoneId)
    .first<{ id: number }>();
  if (!row) {
    throw new HttpError(404, 'image_not_found', 'Milestone image was not found.');
  }
}

export async function listPublishedMilestones(
  db: D1Database,
  origin: string,
): Promise<TimelineMilestone[]> {
  const result = await db
    .prepare(`${SELECT_MILESTONE_COLUMNS}
      WHERE m.is_published = 1
      ORDER BY m.year ASC, m.month ASC, m.display_order ASC, m.id ASC`)
    .all<MilestoneRow>();

  return result.results.map((row) => toTimelineMilestone(row, origin));
}

export async function listAllMilestones(
  db: D1Database,
  origin: string,
): Promise<AdminMilestoneSummary[]> {
  const result = await db
    .prepare(`${SELECT_MILESTONE_COLUMNS}
      ORDER BY m.year ASC, m.month ASC, m.display_order ASC, m.id ASC`)
    .all<MilestoneRow>();

  return result.results.map((row) => toAdminMilestone(row, origin));
}

async function milestoneDetailFromRow(
  db: D1Database,
  row: MilestoneRow,
  origin: string,
): Promise<MilestoneDetail> {
  const [imagesResult, sectionsResult] = await Promise.all([
    db
      .prepare(`
        SELECT id, mime_type, byte_size, alt_text, caption, display_order, is_cover
        FROM milestone_images
        WHERE milestone_id = ?1
        ORDER BY is_cover DESC, display_order ASC, id ASC`)
      .bind(row.id)
      .all<MilestoneImageRow>(),
    db
      .prepare(`
        SELECT id, heading, body_markdown, display_order
        FROM milestone_sections
        WHERE milestone_id = ?1
        ORDER BY display_order ASC, id ASC`)
      .bind(row.id)
      .all<MilestoneSectionRow>(),
  ]);

  return {
    ...toTimelineMilestone(row, origin),
    detailMarkdown: row.detail_markdown,
    images: imagesResult.results.map((image) => toImage(image, origin)),
    sections: sectionsResult.results.map(toSection),
  };
}

export async function getPublishedMilestoneBySlug(
  db: D1Database,
  slug: string,
  origin: string,
): Promise<MilestoneDetail> {
  const row = await db
    .prepare(`${SELECT_MILESTONE_COLUMNS}
      WHERE m.slug = ?1 AND m.is_published = 1
      LIMIT 1`)
    .bind(slug)
    .first<MilestoneRow>();

  if (!row) {
    throw new HttpError(404, 'milestone_not_found', 'Published milestone was not found.');
  }

  return milestoneDetailFromRow(db, row, origin);
}

export async function getMilestoneById(
  db: D1Database,
  milestoneId: number,
  origin: string,
): Promise<MilestoneDetail> {
  const row = await db
    .prepare(`${SELECT_MILESTONE_COLUMNS}
      WHERE m.id = ?1
      LIMIT 1`)
    .bind(milestoneId)
    .first<MilestoneRow>();

  if (!row) {
    throw new HttpError(404, 'milestone_not_found', 'Milestone was not found.');
  }

  return milestoneDetailFromRow(db, row, origin);
}

export async function getPublishedImageById(
  db: D1Database,
  imageId: number,
): Promise<MilestoneImageContentRow> {
  const row = await db
    .prepare(`
      SELECT i.id, i.mime_type, i.base64_data, i.byte_size
      FROM milestone_images i
      INNER JOIN milestones m ON m.id = i.milestone_id
      WHERE i.id = ?1 AND m.is_published = 1
      LIMIT 1`)
    .bind(imageId)
    .first<MilestoneImageContentRow>();

  if (!row) {
    throw new HttpError(404, 'image_not_found', 'Published milestone image was not found.');
  }

  return row;
}

export async function createMilestone(db: D1Database, input: MilestoneWriteInput): Promise<number> {
  const publishedAt = input.isPublished ? new Date().toISOString() : null;
  const result = await db
    .prepare(`
      INSERT INTO milestones (
        slug,
        year,
        month,
        title,
        short_description,
        expanded_description,
        detail_markdown,
        display_order,
        is_published,
        published_at,
        updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, CURRENT_TIMESTAMP)`)
    .bind(
      input.slug,
      input.year,
      input.month,
      input.title,
      input.shortDescription,
      input.expandedDescription ?? null,
      input.detailMarkdown ?? null,
      input.displayOrder ?? 0,
      input.isPublished ? 1 : 0,
      publishedAt,
    )
    .run();

  const id = Number(result.meta.last_row_id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(500, 'milestone_create_failed', 'Milestone was inserted but its identifier was unavailable.');
  }
  return id;
}

export async function updateMilestone(
  db: D1Database,
  milestoneId: number,
  input: MilestoneWriteInput,
): Promise<void> {
  await milestoneExists(db, milestoneId);

  const existing = await db
    .prepare('SELECT is_published, published_at FROM milestones WHERE id = ?1')
    .bind(milestoneId)
    .first<{ is_published: number; published_at: string | null }>();

  const publishedAt = input.isPublished
    ? existing?.published_at ?? new Date().toISOString()
    : null;

  await db
    .prepare(`
      UPDATE milestones
      SET
        slug = ?1,
        year = ?2,
        month = ?3,
        title = ?4,
        short_description = ?5,
        expanded_description = ?6,
        detail_markdown = ?7,
        display_order = ?8,
        is_published = ?9,
        published_at = ?10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?11`)
    .bind(
      input.slug,
      input.year,
      input.month,
      input.title,
      input.shortDescription,
      input.expandedDescription ?? null,
      input.detailMarkdown ?? null,
      input.displayOrder ?? 0,
      input.isPublished ? 1 : 0,
      publishedAt,
      milestoneId,
    )
    .run();
}

export async function deleteMilestone(db: D1Database, milestoneId: number): Promise<void> {
  await milestoneExists(db, milestoneId);
  await db.prepare('DELETE FROM milestones WHERE id = ?1').bind(milestoneId).run();
}

export async function replaceMilestoneSections(
  db: D1Database,
  milestoneId: number,
  sections: MilestoneSectionWriteInput[],
): Promise<void> {
  await milestoneExists(db, milestoneId);

  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM milestone_sections WHERE milestone_id = ?1').bind(milestoneId),
    ...sections.map((section, index) =>
      db
        .prepare(`
          INSERT INTO milestone_sections (
            milestone_id,
            heading,
            body_markdown,
            display_order,
            updated_at
          ) VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)`)
        .bind(
          milestoneId,
          section.heading ?? null,
          section.bodyMarkdown,
          section.displayOrder ?? index,
        ),
    ),
  ];

  await db.batch(statements);
}

function imageInsertStatement(
  db: D1Database,
  milestoneId: number,
  image: MilestoneImageWriteInput,
  fallbackOrder: number,
): D1PreparedStatement {
  return db
    .prepare(`
      INSERT INTO milestone_images (
        milestone_id,
        mime_type,
        base64_data,
        byte_size,
        alt_text,
        caption,
        display_order,
        is_cover
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`)
    .bind(
      milestoneId,
      image.mimeType,
      image.base64Data,
      base64ByteSize(image.base64Data),
      image.altText,
      image.caption ?? null,
      image.displayOrder ?? fallbackOrder,
      image.isCover ? 1 : 0,
    );
}

export async function replaceMilestoneImages(
  db: D1Database,
  milestoneId: number,
  images: MilestoneImageWriteInput[],
): Promise<void> {
  await milestoneExists(db, milestoneId);

  const coverCount = images.filter((image) => image.isCover).length;
  if (coverCount > 1) {
    throw new HttpError(400, 'multiple_cover_images', 'Only one image can be marked as the cover image.');
  }

  const statements: D1PreparedStatement[] = [
    db.prepare('DELETE FROM milestone_images WHERE milestone_id = ?1').bind(milestoneId),
    ...images.map((image, index) => imageInsertStatement(db, milestoneId, image, index)),
  ];

  await db.batch(statements);
}

export async function addMilestoneImage(
  db: D1Database,
  milestoneId: number,
  image: MilestoneImageWriteInput,
): Promise<number> {
  await milestoneExists(db, milestoneId);

  if (image.isCover) {
    await db
      .prepare('UPDATE milestone_images SET is_cover = 0 WHERE milestone_id = ?1')
      .bind(milestoneId)
      .run();
  }

  const result = await imageInsertStatement(db, milestoneId, image, 0).run();
  const imageId = Number(result.meta.last_row_id);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    throw new HttpError(500, 'image_create_failed', 'Image was inserted but its identifier was unavailable.');
  }
  return imageId;
}

export async function deleteMilestoneImage(
  db: D1Database,
  milestoneId: number,
  imageId: number,
): Promise<void> {
  await milestoneExists(db, milestoneId);
  await imageExistsForMilestone(db, milestoneId, imageId);
  await db.prepare('DELETE FROM milestone_images WHERE id = ?1').bind(imageId).run();
}
