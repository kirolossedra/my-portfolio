import ProjectSkillsShowcase from './components/project-skills-showcase.tsx';
import PublicSiteNav from './components/public-site-nav.tsx';
import { projectSkillProfiles } from './data/project-skills.ts';

export default function SkillsPage() {
  return (
    <div className="site-shell skills-shell">
      <PublicSiteNav active="skills" />

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
            <a href="#phanosesh">PhanoSesh ↓</a>
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
