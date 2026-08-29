import ProjectSkillsShowcase from './components/project-skills-showcase.tsx';
import { projectSkillProfiles } from './data/project-skills.ts';

export default function SkillsPage() {
  return (
    <div className="site-shell skills-shell">
      <header className="site-nav">
        <a className="brand" href="/" aria-label="kirolos.dev home">kirolos<span>.dev</span></a>
        <nav aria-label="Primary navigation">
          <a href="/#history">History</a>
          <a href="/skills" aria-current="page">Skills</a>
          <a href="/opinions">Opinions</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <main className="skills-page">
        <section className="skills-hero">
          <p className="eyebrow">Skills, with evidence</p>
          <h1>Two systems. One rolling record.</h1>
          <p>
            The projects now run side by side like closing credits: the strongest capabilities arrive first,
            then progressively finer implementation evidence. Both columns move on their own, while wheel,
            touch, and keyboard scrolling remain fully yours whenever you want to inspect something.
          </p>
          <div className="skills-hero-jump">
            <a href="#linc-one">LInC One ↓</a>
            <a href="#eureka-vault">EurekaVault ↓</a>
          </div>
        </section>

        <ProjectSkillsShowcase projects={projectSkillProfiles} />
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
