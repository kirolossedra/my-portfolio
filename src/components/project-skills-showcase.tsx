import { useEffect, useRef, useState } from 'react';
import type { ProjectSkill, ProjectSkillProfile, SkillPriority } from '../data/project-skills.ts';

const priorityLabels: Record<SkillPriority, string> = {
  major: 'Major capabilities',
  strong: 'Strong implementation',
  detail: 'Granular engineering evidence',
};

function CreditSkill({ skill, index }: { skill: ProjectSkill; index: number }) {
  return (
    <div className={`skill-credit skill-credit--${skill.priority}`}>
      <span className="skill-credit-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <small>{skill.category}</small>
        <strong>{skill.label}</strong>
        {skill.detail && <p>{skill.detail}</p>}
      </div>
    </div>
  );
}

function CreditSet({ project, duplicate = false }: { project: ProjectSkillProfile; duplicate?: boolean }) {
  let previousPriority: SkillPriority | null = null;

  return (
    <ol className="skill-credit-set" aria-hidden={duplicate || undefined}>
      {project.skills.map((skill, index) => {
        const showGroup = skill.priority !== previousPriority;
        previousPriority = skill.priority;
        return (
          <li className="skill-credit-entry" key={`${skill.category}-${skill.label}`}>
            {showGroup && (
              <div className="skill-credit-chapter">
                <span>{priorityLabels[skill.priority]}</span>
                <i />
              </div>
            )}
            <CreditSkill skill={skill} index={index} />
          </li>
        );
      })}
    </ol>
  );
}

function ProjectCreditsPanel({ project, side }: { project: ProjectSkillProfile; side: 'left' | 'right' }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const firstSetRef = useRef<HTMLDivElement | null>(null);
  const lastInteractionRef = useRef(0);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstSetWrapper = firstSetRef.current;
    if (!viewport || !firstSetWrapper) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setAutoScroll(false);
      viewport.scrollTop = 0;
      return;
    }

    let animationFrame = 0;
    let lastFrame = performance.now();
    let loopHeight = 0;

    const measure = () => {
      const set = firstSetWrapper.querySelector<HTMLElement>('.skill-credit-set');
      if (!set) return;
      const track = firstSetWrapper.parentElement;
      const trackStyles = track ? window.getComputedStyle(track) : null;
      const gap = Number.parseFloat(trackStyles?.rowGap || trackStyles?.gap || '0') || 0;
      loopHeight = set.getBoundingClientRect().height + gap;
      if (loopHeight > 0 && viewport.scrollTop < loopHeight * 0.4) {
        viewport.scrollTop = loopHeight;
      }
    };

    const normalize = () => {
      if (loopHeight <= 0) return;
      if (viewport.scrollTop >= loopHeight * 2) viewport.scrollTop -= loopHeight;
      if (viewport.scrollTop <= loopHeight * 0.18) viewport.scrollTop += loopHeight;
    };

    const animate = (now: number) => {
      const delta = Math.min(48, now - lastFrame);
      lastFrame = now;
      normalize();

      const interactionCoolingOff = now - lastInteractionRef.current < 1650;
      if (autoScroll && !interactionCoolingOff && !document.hidden) {
        const pixelsPerMs = side === 'left' ? 0.020 : 0.022;
        viewport.scrollTop += delta * pixelsPerMs;
        normalize();
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const markInteraction = () => {
      lastInteractionRef.current = performance.now();
    };

    const handleKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        markInteraction();
      }
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(firstSetWrapper);

    viewport.addEventListener('wheel', markInteraction, { passive: true });
    viewport.addEventListener('touchstart', markInteraction, { passive: true });
    viewport.addEventListener('touchmove', markInteraction, { passive: true });
    viewport.addEventListener('pointerdown', markInteraction, { passive: true });
    viewport.addEventListener('keydown', handleKey);
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      viewport.removeEventListener('wheel', markInteraction);
      viewport.removeEventListener('touchstart', markInteraction);
      viewport.removeEventListener('touchmove', markInteraction);
      viewport.removeEventListener('pointerdown', markInteraction);
      viewport.removeEventListener('keydown', handleKey);
    };
  }, [autoScroll, side]);

  return (
    <article className={`skills-credits-panel skills-credits-panel--${project.id}`} id={project.id}>
      <header className="skills-credits-project-head">
        <div>
          <p className="eyebrow">{project.eyebrow}</p>
          <h2>{project.name}</h2>
        </div>
        <button
          type="button"
          className={`skills-auto-toggle${autoScroll ? ' is-active' : ''}`}
          onClick={() => setAutoScroll((current) => !current)}
          aria-pressed={autoScroll}
        >
          <span aria-hidden="true">{autoScroll ? '▶' : 'Ⅱ'}</span>
          {autoScroll ? 'Auto rolling' : 'Manual scroll'}
        </button>
        <p className="skills-credits-summary">{project.summary}</p>
        <div className="project-stack" aria-label={`${project.name} technologies`}>
          {project.stack.map((item) => <span key={item}>{item}</span>)}
        </div>
      </header>

      <div className="skills-credit-frame">
        <div className="skills-credit-rail" aria-hidden="true"><span>SKILLS / CREDITS</span><i /></div>
        <div
          className="skills-credit-viewport"
          ref={viewportRef}
          tabIndex={0}
          aria-label={`${project.name} skills credits. Auto-scrolls; use wheel, touch, or keyboard to scroll manually.`}
        >
          <div className="skills-credit-track">
            <div ref={firstSetRef}><CreditSet project={project} duplicate /></div>
            <CreditSet project={project} />
            <CreditSet project={project} duplicate />
          </div>
        </div>
      </div>

      <footer className="skills-credits-evolution" aria-label={`${project.name} repository evolution`}>
        {project.evolution.map((item, index) => (
          <div key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>
        ))}
      </footer>
    </article>
  );
}

export default function ProjectSkillsShowcase({ projects }: { projects: ProjectSkillProfile[] }) {
  if (projects.length < 2) return null;
  const [left, right] = projects;

  return (
    <section className="skills-credits-stage" aria-label="Project skills split-screen credits">
      <ProjectCreditsPanel project={left!} side="left" />
      <div className="skills-anime-divider" aria-hidden="true"><span /></div>
      <ProjectCreditsPanel project={right!} side="right" />
    </section>
  );
}
