import { useEffect, useRef } from 'react';
import type { ProjectSkillProfile } from '../data/project-skills.ts';
import { shouldRevealSkill, skillRevealLine } from '../lib/scroll-reveal.ts';

function LincLook() {
  return (
    <div className="project-look project-look--linc" aria-label="LInC One visual preview">
      <div className="project-look-window project-look-window--linc">
        <div className="project-look-window-bar">
          <span /><span /><span />
          <small>lincministry.com</small>
        </div>
        <div className="linc-look-hero">
          <img src="/media/projects/linc-one/linc-logo.png" alt="LInC One logo" />
          <div>
            <span>LINC ONE</span>
            <strong>Connect. Grow. Serve.</strong>
            <small>تواصل · انمُ · اخدم</small>
          </div>
        </div>
        <div className="linc-look-grid">
          <span>People</span><span>Ministry</span><span>Library</span><span>Attendance</span>
        </div>
        <div className="linc-look-bezalel"><i>✦</i><span>Bezalel AI</span><small>grounded, server-mediated assistance</small></div>
        <div className="linc-look-slogan">
          <img src="/media/projects/linc-one/discipleship-slogan-preview.webp" alt="The Roots discipleship program artwork" />
        </div>
      </div>
      <div className="project-evidence-card">
        <span>Repository evolution</span>
        <ol>
          <li>Firebase product surface</li>
          <li>Hono trust boundaries</li>
          <li>Canonical identity</li>
          <li>Quality gates</li>
          <li>Ministry + Discipleship</li>
        </ol>
      </div>
    </div>
  );
}

function EurekaLook() {
  return (
    <div className="project-look project-look--eureka" aria-label="EurekaVault visual preview">
      <div className="project-look-window project-look-window--eureka">
        <div className="project-look-window-bar">
          <span /><span /><span />
          <small>EurekaVault</small>
        </div>
        <div className="eureka-look-shell">
          <aside>
            <b>ε</b>
            <i /><i /><i /><i /><i />
          </aside>
          <div className="eureka-look-main">
            <div className="eureka-look-heading"><span>PERSONAL VAULT</span><strong>Prompt Blocks</strong></div>
            <div className="eureka-look-graph">
              <div className="eureka-node eureka-node--input">Prompt</div>
              <div className="eureka-wire eureka-wire--one" />
              <div className="eureka-node eureka-node--transform">Transform</div>
              <div className="eureka-wire eureka-wire--two" />
              <div className="eureka-node eureka-node--constraint">Mindset</div>
              <div className="eureka-wire eureka-wire--three" />
              <div className="eureka-node eureka-node--output">Output</div>
            </div>
            <div className="eureka-look-footer"><span>Versioned</span><span>Inspectable</span><span>Typed DAG</span></div>
          </div>
        </div>
      </div>
      <div className="project-evidence-card project-evidence-card--eureka">
        <span>Commit-backed growth</span>
        <div className="eureka-velocity-thumb"><img src="/media/projects/eureka-vault/weekly-velocity.svg" alt="EurekaVault weekly commit velocity chart" /></div>
      </div>
    </div>
  );
}

function ProjectLook({ project }: { project: ProjectSkillProfile }) {
  return project.id === 'linc-one' ? <LincLook /> : <EurekaLook />;
}

export default function ProjectSkillsShowcase({ project, reverse = false }: { project: ProjectSkillProfile; reverse?: boolean }) {
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = itemRefs.current.filter((item): item is HTMLLIElement => Boolean(item));

    if (reduceMotion) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const revealLine = skillRevealLine(window.scrollY, window.innerHeight);
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const absoluteCenter = window.scrollY + rect.top + rect.height * 0.5;
        item.classList.toggle('is-visible', shouldRevealSkill(absoluteCenter, revealLine));
      });
    };
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <section className={`project-skills-section${reverse ? ' project-skills-section--reverse' : ''}`} id={project.id}>
      <div className="project-skills-sticky">
        <div className="project-skills-copy">
          <p className="eyebrow">{project.eyebrow}</p>
          <h2>{project.name}</h2>
          <p>{project.summary}</p>
          <div className="project-stack" aria-label={`${project.name} technologies`}>
            {project.stack.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>
        <ProjectLook project={project} />
        <div className="project-evolution" aria-label={`${project.name} repository evolution`}>
          {project.evolution.map((item, index) => (
            <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>
          ))}
        </div>
      </div>

      <div className="project-skill-feed">
        <div className="project-skill-feed-heading">
          <span>{project.skills.length} extracted capabilities</span>
          <p>Higher-signal skills arrive first. Keep scrolling for the increasingly granular engineering evidence.</p>
        </div>
        <ul>
          {project.skills.map((skill, index) => (
            <li
              key={`${skill.category}-${skill.label}`}
              className={`project-skill-item project-skill-item--${skill.priority}`}
              ref={(node: HTMLLIElement | null) => { itemRefs.current[index] = node; }}
            >
              <span className="project-skill-bullet" aria-hidden="true" />
              <div>
                <small>{skill.category}</small>
                <strong>{skill.label}</strong>
                {skill.detail && <p>{skill.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
