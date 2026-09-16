import KiroChat from './features/kiro-rag/kiro-chat.tsx';
import PublicSiteNav from './components/public-site-nav.tsx';

export default function KiroRagPage() {
  return (
    <div className="site-shell kiro-chat-shell">
      <PublicSiteNav active="kiro" />

      <main className="kiro-chat-main">
        <KiroChat />
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
