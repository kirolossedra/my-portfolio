import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import OpinionsAdminPanel from './opinions-admin-panel.tsx';
import type {
  AdminMilestoneSummary,
  AdminSession,
  MilestoneDetail,
  MilestoneImageWriteInput,
  MilestoneSectionWriteInput,
  MilestoneWriteInput,
} from '../../shared/milestone.ts';
import {
  addAdminImage,
  beginGitHubLogin,
  clearAdminToken,
  createAdminMilestone,
  deleteAdminImage,
  deleteAdminMilestone,
  getAdminToken,
  listAdminMilestones,
  loadAdminMilestone,
  replaceAdminSections,
  updateAdminMilestone,
  verifyAdminSession,
} from './api.ts';

const MAX_IMAGE_BYTES = 1_310_720;
const ACCEPTED_IMAGE_TYPES = new Set(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']);

type EditorModel = {
  id: number | null;
  slug: string;
  year: string;
  month: string;
  title: string;
  shortDescription: string;
  expandedDescription: string;
  detailMarkdown: string;
  displayOrder: string;
  isPublished: boolean;
  sections: MilestoneSectionWriteInput[];
  images: MilestoneDetail['images'];
};

type PendingImage = MilestoneImageWriteInput & { fileName: string };

function emptyEditor(): EditorModel {
  const now = new Date();
  return {
    id: null,
    slug: '',
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    title: '',
    shortDescription: '',
    expandedDescription: '',
    detailMarkdown: '',
    displayOrder: '0',
    isPublished: false,
    sections: [],
    images: [],
  };
}

function editorFromDetail(detail: MilestoneDetail, summary: AdminMilestoneSummary): EditorModel {
  return {
    id: detail.id,
    slug: detail.slug,
    year: String(detail.date.year),
    month: String(detail.date.month),
    title: detail.title,
    shortDescription: detail.summary,
    expandedDescription: detail.description,
    detailMarkdown: detail.detailMarkdown ?? '',
    displayOrder: String(summary.displayOrder),
    isPublished: summary.isPublished,
    sections: detail.sections.map((section) => ({
      heading: section.heading,
      bodyMarkdown: section.bodyMarkdown,
      displayOrder: section.displayOrder,
    })),
    images: detail.images,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not encode the selected image.'));
        return;
      }
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

function toWriteInput(editor: EditorModel): MilestoneWriteInput {
  const year = Number(editor.year);
  const month = Number(editor.month);
  const displayOrder = Number(editor.displayOrder || '0');
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(displayOrder)) {
    throw new Error('Year, month, and display order must be whole numbers.');
  }
  return {
    slug: editor.slug.trim(),
    year,
    month,
    title: editor.title.trim(),
    shortDescription: editor.shortDescription.trim(),
    expandedDescription: editor.expandedDescription.trim() || null,
    detailMarkdown: editor.detailMarkdown.trim() || null,
    displayOrder,
    isPublished: editor.isPublished,
  };
}

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [milestones, setMilestones] = useState<AdminMilestoneSummary[]>([]);
  const [editor, setEditor] = useState<EditorModel>(emptyEditor);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [status, setStatus] = useState<'checking' | 'signed-out' | 'ready'>('checking');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [workspace, setWorkspace] = useState<'timeline' | 'opinions'>('timeline');

  const selectedSummary = useMemo(
    () => milestones.find((item) => item.id === editor.id),
    [editor.id, milestones],
  );

  const refreshList = async () => {
    const items = await listAdminMilestones();
    setMilestones(items);
    return items;
  };

  useEffect(() => {
    if (!getAdminToken()) {
      setStatus('signed-out');
      return;
    }

    verifyAdminSession()
      .then(async (verified) => {
        setSession(verified);
        const items = await listAdminMilestones();
        setMilestones(items);
        setStatus('ready');
      })
      .catch(() => {
        clearAdminToken();
        setStatus('signed-out');
      });
  }, []);

  const selectMilestone = async (summary: AdminMilestoneSummary) => {
    setBusy(true);
    setMessage('');
    try {
      const detail = await loadAdminMilestone(summary.id);
      setEditor(editorFromDetail(detail, summary));
      setPendingImages([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load milestone.');
    } finally {
      setBusy(false);
    }
  };

  const addSection = () => {
    setEditor((current) => ({
      ...current,
      sections: [...current.sections, { heading: '', bodyMarkdown: '', displayOrder: current.sections.length }],
    }));
  };

  const updateSection = (index: number, field: 'heading' | 'bodyMarkdown', value: string) => {
    setEditor((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section),
    }));
  };

  const removeSection = (index: number) => {
    setEditor((current) => ({
      ...current,
      sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
    }));
  };

  const queueImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setMessage('Use AVIF, GIF, JPEG, PNG, or WebP images only.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMessage('Image exceeds the 1.25 MiB D1 upload limit.');
      return;
    }

    try {
      const base64Data = await fileToBase64(file);
      setPendingImages((current) => [...current, {
        fileName: file.name,
        mimeType: file.type,
        base64Data,
        altText: editor.title || file.name,
        caption: null,
        displayOrder: current.length,
        isCover: current.length === 0,
      }]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not prepare image.');
    }
  };

  const save = async () => {
    setBusy(true);
    setMessage('');
    try {
      const input = toWriteInput(editor);
      const id = editor.id ?? await createAdminMilestone(input);
      if (editor.id) await updateAdminMilestone(id, input);
      await replaceAdminSections(id, editor.sections.map((section, index) => ({
        heading: section.heading?.trim() || null,
        bodyMarkdown: section.bodyMarkdown,
        displayOrder: index,
      })));
      for (const image of pendingImages) {
        await addAdminImage(id, {
          mimeType: image.mimeType,
          base64Data: image.base64Data,
          altText: image.altText,
          caption: image.caption,
          displayOrder: image.displayOrder,
          isCover: image.isCover,
        });
      }

      const items = await refreshList();
      const saved = items.find((item) => item.id === id);
      if (saved) {
        const detail = await loadAdminMilestone(id);
        setEditor(editorFromDetail(detail, saved));
      }
      setPendingImages([]);
      setMessage('Saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save milestone.');
    } finally {
      setBusy(false);
    }
  };

  const removeExistingImage = async (imageId: number) => {
    if (!editor.id) return;
    setBusy(true);
    try {
      await deleteAdminImage(editor.id, imageId);
      const summary = selectedSummary;
      if (summary) {
        const detail = await loadAdminMilestone(editor.id);
        setEditor(editorFromDetail(detail, summary));
      }
      setMessage('Image removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not remove image.');
    } finally {
      setBusy(false);
    }
  };

  const removeCurrentMilestone = async () => {
    if (!editor.id || !window.confirm(`Delete “${editor.title}”?`)) return;
    setBusy(true);
    try {
      await deleteAdminMilestone(editor.id);
      await refreshList();
      setEditor(emptyEditor());
      setPendingImages([]);
      setMessage('Milestone deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete milestone.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearAdminToken();
    setSession(null);
    setStatus('signed-out');
    setMilestones([]);
    setEditor(emptyEditor());
  };

  const copyCliSession = async () => {
    const token = getAdminToken();
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setMessage('Short-lived CLI session copied.');
  };

  if (status === 'checking') {
    return <main className="admin-auth-shell"><p>Checking administrator session…</p></main>;
  }

  if (status === 'signed-out') {
    return (
      <main className="admin-auth-shell">
        <a className="brand" href="/">kirolos<span>.dev</span></a>
        <p className="eyebrow">Private administration</p>
        <h1>Portfolio editor</h1>
        <p>Only the configured GitHub account can open the administrative workspace.</p>
        <button className="admin-primary-button" type="button" onClick={beginGitHubLogin}>
          Sign in with GitHub
        </button>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="brand" href="/">kirolos<span>.dev</span></a>
        <div>
          <nav className="admin-workspace-nav" aria-label="Admin workspace">
            <button className={workspace === 'timeline' ? 'is-active' : ''} type="button" onClick={() => setWorkspace('timeline')}>Timeline</button>
            <button className={workspace === 'opinions' ? 'is-active' : ''} type="button" onClick={() => setWorkspace('opinions')}>Opinions</button>
          </nav>
          <span>{session?.githubLogin}</span>
          <button type="button" onClick={copyCliSession}>Copy CLI session</button>
          <button type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      {workspace === 'opinions' ? <OpinionsAdminPanel /> : (
      <main className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-heading">
            <div><p className="eyebrow">Timeline</p><h2>Milestones</h2></div>
            <button type="button" onClick={() => { setEditor(emptyEditor()); setPendingImages([]); setMessage(''); }}>New</button>
          </div>
          <div className="admin-milestone-list">
            {milestones.map((milestone) => (
              <button
                className={editor.id === milestone.id ? 'is-active' : ''}
                type="button"
                key={milestone.id}
                onClick={() => void selectMilestone(milestone)}
              >
                <span>{milestone.date.year}.{String(milestone.date.month).padStart(2, '0')}</span>
                <strong>{milestone.title}</strong>
                <small>{milestone.isPublished ? 'Published' : 'Draft'}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-editor">
          <div className="admin-editor-heading">
            <div>
              <p className="eyebrow">{editor.id ? 'Edit milestone' : 'New milestone'}</p>
              <h1>{editor.title || 'Untitled milestone'}</h1>
            </div>
            <div className="admin-editor-actions">
              {editor.id && <button className="admin-danger-button" type="button" onClick={() => void removeCurrentMilestone()} disabled={busy}>Delete</button>}
              <button className="admin-primary-button" type="button" onClick={() => void save()} disabled={busy}>{busy ? 'Working…' : 'Save'}</button>
            </div>
          </div>

          {message && <p className="admin-message" role="status">{message}</p>}

          <div className="admin-form-grid">
            <label>Title<input value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label>
            <label>Slug<input value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: event.target.value })} /></label>
            <label>Year<input inputMode="numeric" value={editor.year} onChange={(event) => setEditor({ ...editor, year: event.target.value })} /></label>
            <label>Month<input inputMode="numeric" value={editor.month} onChange={(event) => setEditor({ ...editor, month: event.target.value })} /></label>
            <label>Display order<input inputMode="numeric" value={editor.displayOrder} onChange={(event) => setEditor({ ...editor, displayOrder: event.target.value })} /></label>
            <label className="admin-checkbox"><input type="checkbox" checked={editor.isPublished} onChange={(event) => setEditor({ ...editor, isPublished: event.target.checked })} /> Published</label>
          </div>

          <label className="admin-field">Timeline description<textarea rows={3} value={editor.shortDescription} onChange={(event) => setEditor({ ...editor, shortDescription: event.target.value })} /></label>
          <label className="admin-field">Expanded description<textarea rows={5} value={editor.expandedDescription} onChange={(event) => setEditor({ ...editor, expandedDescription: event.target.value })} /></label>
          <label className="admin-field">Full story introduction<textarea rows={8} value={editor.detailMarkdown} onChange={(event) => setEditor({ ...editor, detailMarkdown: event.target.value })} /></label>

          <div className="admin-subsection">
            <div className="admin-subsection-heading"><div><p className="eyebrow">Long-form content</p><h2>Sections</h2></div><button type="button" onClick={addSection}>Add section</button></div>
            {editor.sections.map((section, index) => (
              <div className="admin-section-editor" key={`section-${index}`}>
                <input placeholder="Heading (optional)" value={section.heading ?? ''} onChange={(event) => updateSection(index, 'heading', event.target.value)} />
                <textarea rows={7} placeholder="Section body" value={section.bodyMarkdown} onChange={(event) => updateSection(index, 'bodyMarkdown', event.target.value)} />
                <button type="button" onClick={() => removeSection(index)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="admin-subsection">
            <div className="admin-subsection-heading"><div><p className="eyebrow">D1 Base64 storage</p><h2>Photography</h2></div><label className="admin-file-button">Add image<input type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/webp" onChange={(event) => void queueImage(event)} /></label></div>
            <p className="admin-help">Images are encoded in the browser and stored directly in D1. Maximum original file size: 1.25 MiB.</p>
            <div className="admin-image-list">
              {editor.images.map((image) => (
                <div key={image.id}><span>{image.altText || `Image ${image.id}`}</span><small>{Math.ceil(image.byteSize / 1024)} KiB{image.isCover ? ' · cover' : ''}</small><button type="button" onClick={() => void removeExistingImage(image.id)} disabled={busy}>Remove</button></div>
              ))}
              {pendingImages.map((image, index) => (
                <div key={`${image.fileName}-${index}`}><span>{image.fileName}</span><small>Queued{image.isCover ? ' · cover' : ''}</small><button type="button" onClick={() => setPendingImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}>Remove</button></div>
              ))}
            </div>
          </div>
        </section>
      </main>
      )}
    </div>
  );
}
