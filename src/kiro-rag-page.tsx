import KiroChat from './features/kiro-rag/kiro-chat.tsx';

export default function KiroRagPage() {
  return (
    <div className="site-shell kiro-chat-shell">
      <header className="site-nav">
        <a className="brand" href="/" aria-label="kirolos.dev home">kirolos<span>.dev</span></a>
        <nav aria-label="Primary navigation">
          <a href="/#history">History</a>
          <a href="/skills">Skills</a>
          <a href="/opinions">Opinions</a>
          <a href="/kiro-rag" aria-current="page">Kiro Rag</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

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
