import { useEffect, useRef } from 'react';
import type { ProjectSkillProfile } from '../data/project-skills.ts';
import { shouldRevealSkill, skillRevealLine } from '../lib/scroll-reveal.ts';

const AUTO_SCROLL_PX_PER_SECOND = 26;
const SKILL_LOOP_COPIES = 4;

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

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const primaryList = feed.querySelector<HTMLUListElement>('[data-skill-loop-primary="true"]');
    const cloneLists = Array.from(feed.querySelectorAll<HTMLUListElement>('[data-skill-loop-copy="true"]'));

    const getItems = () => Array.from(feed.querySelectorAll<HTMLLIElement>('.project-skill-item'));

    const updateReveal = () => {
      const revealLine = skillRevealLine(feed.scrollTop, feed.clientHeight);
      getItems().forEach((item) => {
        const itemCenter = item.offsetTop + item.offsetHeight * 0.5;
        item.classList.toggle('is-visible', shouldRevealSkill(itemCenter, revealLine));
      });
    };

    if (reduceMotion) {
      cloneLists.forEach((list) => { list.hidden = true; });
      getItems().forEach((item) => item.classList.add('is-visible'));
      return;
    }

    let frame = 0;
    let revealFrame = 0;
    let lastTime = performance.now();
    let mouseHeld = false;
    let touchHeld = false;
    let mouseDragging = false;
    let dragPointerId: number | null = null;
    let dragStartY = 0;
    let dragStartScrollTop = 0;
    let normalizing = false;

    const scheduleReveal = () => {
      if (revealFrame) return;
      revealFrame = window.requestAnimationFrame(() => {
        revealFrame = 0;
        updateReveal();
      });
    };

    const normalizeLoop = () => {
      if (!primaryList || normalizing) return;

      const loopStart = primaryList.offsetTop;
      const loopHeight = primaryList.offsetHeight;
      if (loopHeight <= 0) return;

      // Keep two complete copies ahead of the viewport. When we cross that
      // boundary, move back by exactly one copy; because the content is
      // identical, the credits continue without a visible reset.
      const wrapAt = loopStart + loopHeight * 2;
      if (feed.scrollTop >= wrapAt) {
        normalizing = true;
        while (feed.scrollTop >= wrapAt) feed.scrollTop -= loopHeight;
        normalizing = false;
      }
    };

    const isFeedVisible = () => {
      const rect = feed.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    const onScroll = () => {
      normalizeLoop();
      scheduleReveal();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button === 0) {
        mouseHeld = true;
        mouseDragging = true;
        dragPointerId = event.pointerId;
        dragStartY = event.clientY;
        dragStartScrollTop = feed.scrollTop;
        feed.style.userSelect = 'none';
        feed.setPointerCapture?.(event.pointerId);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!mouseDragging || event.pointerId !== dragPointerId) return;
      event.preventDefault();
      feed.scrollTop = dragStartScrollTop - (event.clientY - dragStartY);
      normalizeLoop();
      scheduleReveal();
    };

    const releasePointer = (event: PointerEvent) => {
      if (mouseDragging && event.pointerId === dragPointerId) {
        mouseHeld = false;
        mouseDragging = false;
        dragPointerId = null;
        feed.style.userSelect = '';
        try {
          if (feed.hasPointerCapture?.(event.pointerId)) feed.releasePointerCapture(event.pointerId);
        } catch {
          // The browser may already have released capture after a cancel.
        }
      }
    };

    const onTouchStart = () => {
      touchHeld = true;
    };

    const onTouchEnd = () => {
      touchHeld = false;
    };

    const tick = (now: number) => {
      const elapsed = Math.min(48, now - lastTime);
      lastTime = now;

      // Auto motion is the baseline. Native wheel/touch scrolling changes the
      // same scrollTop directly, so the user can speed it up or reverse it.
      // Holding/dragging the feed is the only thing that intentionally stops
      // the baseline while the hand is on the credits.
      if (!mouseHeld && !touchHeld && !document.hidden && isFeedVisible()) {
        feed.scrollTop += AUTO_SCROLL_PX_PER_SECOND * (elapsed / 1000);
        normalizeLoop();
        updateReveal();
      }

      frame = window.requestAnimationFrame(tick);
    };

    feed.addEventListener('scroll', onScroll, { passive: true });
    feed.addEventListener('pointerdown', onPointerDown, { passive: true });
    feed.addEventListener('pointermove', onPointerMove);
    feed.addEventListener('touchstart', onTouchStart, { passive: true });
    feed.addEventListener('touchend', onTouchEnd, { passive: true });
    feed.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('pointerup', releasePointer, { passive: true });
    window.addEventListener('pointercancel', releasePointer, { passive: true });
    window.addEventListener('resize', scheduleReveal);

    updateReveal();
    frame = window.requestAnimationFrame(tick);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (revealFrame) window.cancelAnimationFrame(revealFrame);
      feed.style.userSelect = '';
      feed.removeEventListener('scroll', onScroll);
      feed.removeEventListener('pointerdown', onPointerDown);
      feed.removeEventListener('pointermove', onPointerMove);
      feed.removeEventListener('touchstart', onTouchStart);
      feed.removeEventListener('touchend', onTouchEnd);
      feed.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('pointerup', releasePointer);
      window.removeEventListener('pointercancel', releasePointer);
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
        {Array.from({ length: SKILL_LOOP_COPIES }, (_, copyIndex) => (
          <ul
            key={`skill-loop-${copyIndex}`}
            data-skill-loop-primary={copyIndex === 0 ? 'true' : undefined}
            data-skill-loop-copy={copyIndex === 0 ? undefined : 'true'}
            aria-hidden={copyIndex === 0 ? undefined : true}
          >
            {project.skills.map((skill) => (
              <li
                key={`${copyIndex}-${skill.category}-${skill.label}`}
                className={`project-skill-item project-skill-item--${skill.priority}`}
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
        ))}
      </div>
    </section>
  );
}
