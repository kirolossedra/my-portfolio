import { useEffect, useRef } from 'react';
import type { ProjectSkillProfile } from '../data/project-skills.ts';
import { shouldRevealSkill, skillRevealLine } from '../lib/scroll-reveal.ts';

const AUTO_SCROLL_PX_PER_SECOND = 24;
const MANUAL_SCROLL_GRACE_MS = 700;

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
  const sectionRef = useRef<HTMLElement | null>(null);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const feed = feedRef.current;
    if (!section || !feed) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = itemRefs.current.filter((item): item is HTMLLIElement => Boolean(item));

    const updateReveal = () => {
      const revealLine = skillRevealLine(feed.scrollTop, feed.clientHeight);
      items.forEach((item) => {
        const itemCenter = item.offsetTop + item.offsetHeight * 0.5;
        item.classList.toggle('is-visible', shouldRevealSkill(itemCenter, revealLine));
      });
    };

    if (reduceMotion) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    let frame = 0;
    let lastTime = performance.now();
    let sectionVisible = false;
    let pointerHeld = false;
    let manualUntil = 0;

    const scheduleReveal = () => {
      window.requestAnimationFrame(updateReveal);
    };

    const markManualScroll = () => {
      manualUntil = performance.now() + MANUAL_SCROLL_GRACE_MS;
      scheduleReveal();
    };

    const onPointerDown = () => {
      pointerHeld = true;
    };

    const onPointerUp = () => {
      pointerHeld = false;
      manualUntil = performance.now() + 220;
    };

    const tick = (now: number) => {
      const elapsed = Math.min(48, now - lastTime);
      lastTime = now;

      const maxScroll = Math.max(0, feed.scrollHeight - feed.clientHeight);
      const userHasControl = pointerHeld || now < manualUntil;

      if (sectionVisible && !userHasControl && feed.scrollTop < maxScroll - 0.5) {
        feed.scrollTop = Math.min(maxScroll, feed.scrollTop + AUTO_SCROLL_PX_PER_SECOND * (elapsed / 1000));
        updateReveal();
      }

      frame = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        sectionVisible = entry.isIntersecting && entry.intersectionRatio > 0.08;
        lastTime = performance.now();
      },
      { threshold: [0, 0.08, 0.25, 0.5] },
    );

    observer.observe(section);
    feed.addEventListener('scroll', scheduleReveal, { passive: true });
    feed.addEventListener('wheel', markManualScroll, { passive: true });
    feed.addEventListener('touchstart', onPointerDown, { passive: true });
    feed.addEventListener('touchend', onPointerUp, { passive: true });
    feed.addEventListener('touchcancel', onPointerUp, { passive: true });
    feed.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('resize', scheduleReveal);

    updateReveal();
    frame = window.requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      feed.removeEventListener('scroll', scheduleReveal);
      feed.removeEventListener('wheel', markManualScroll);
      feed.removeEventListener('touchstart', onPointerDown);
      feed.removeEventListener('touchend', onPointerUp);
      feed.removeEventListener('touchcancel', onPointerUp);
      feed.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', scheduleReveal);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`project-skills-section${reverse ? ' project-skills-section--reverse' : ''}`}
      id={project.id}
    >
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

      <div
        ref={feedRef}
        className="project-skill-feed"
        tabIndex={0}
        aria-label={`${project.name} automatically scrolling skills. Scroll, swipe, or hold to control the credits.`}
      >
        <div className="project-skill-feed-heading">
          <span>{project.skills.length} extracted capabilities</span>
          <p>Higher-signal skills arrive first. Scroll or swipe whenever you want to take control of the rolling credits.</p>
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
