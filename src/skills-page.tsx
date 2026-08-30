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
          <a href="/kiro-rag">Kiro Rag</a>
          <a href="https://github.com/kirolossedra" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <main className="skills-page">
        <section className="skills-hero">
          <p className="eyebrow">Skills, with evidence</p>
          <h1>What building the systems actually teaches.</h1>
          <p>
            Not a flat keyword cloud. This is an exhaustive read of two real products: their source trees,
            architecture, tests, documentation, and GitHub commit evolution. The strongest capabilities lead;
            the smaller implementation skills unfold as you continue down the page.
          </p>
          <div className="skills-hero-jump">
            <a href="#linc-one">LInC One ↓</a>
            <a href="#eureka-vault">EurekaVault ↓</a>
          </div>
        </section>

        {projectSkillProfiles.map((project, index) => (
          <ProjectSkillsShowcase key={project.id} project={project} reverse={index % 2 === 1} />
        ))}
      </main>

      <footer className="site-footer">
        <span>© 2026 Kirolos Sedra</span>
        <span>kirolos.dev</span>
      </footer>
    </div>
  );
}
