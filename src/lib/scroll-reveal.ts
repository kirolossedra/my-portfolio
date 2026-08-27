export const SKILL_REVEAL_VIEWPORT_RATIO = 0.78;

export function skillRevealLine(scrollY: number, viewportHeight: number): number {
  return scrollY + viewportHeight * SKILL_REVEAL_VIEWPORT_RATIO;
}

export function shouldRevealSkill(itemCenter: number, revealLine: number): boolean {
  return itemCenter <= revealLine;
}
