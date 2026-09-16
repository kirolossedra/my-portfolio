import { useState } from 'react';
import AdminNavLink from './admin-nav-link.tsx';

type PublicSection = 'home' | 'skills' | 'opinions' | 'kiro';

export default function PublicSiteNav({ active = 'home' }: { active?: PublicSection }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-nav">
      <a className="brand" href="/" aria-label="kirolos.dev home">kirolos<span>.dev</span></a>
      <div className={`site-nav-menu${menuOpen ? ' is-open' : ''}`}>
        <button
          className="site-nav-menu__toggle"
          type="button"
          aria-label="Navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span className="site-nav-menu__label">Menu</span>
          <span className="site-nav-menu__icon" aria-hidden="true"><i /><i /></span>
        </button>
        <nav aria-label="Primary navigation" onClick={() => setMenuOpen(false)}>
          <a href="/#history">History</a>
          <a href="/skills" aria-current={active === 'skills' ? 'page' : undefined}>Skills</a>
          <a href="/opinions" aria-current={active === 'opinions' ? 'page' : undefined}>Opinions</a>
          <a href="/kiro-rag" aria-current={active === 'kiro' ? 'page' : undefined}>Kiro Rag</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">GitHub ↗</a>
          <AdminNavLink />
        </nav>
      </div>
    </header>
  );
}
