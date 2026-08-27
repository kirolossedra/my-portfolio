import { describe, expect, it } from 'vitest';
import { projectSkillProfiles, type SkillPriority } from '../data/project-skills.ts';

const rank: Record<SkillPriority, number> = { major: 0, strong: 1, detail: 2 };

describe('project skill evidence', () => {
  it('keeps an exhaustive skill set for both source projects', () => {
    expect(projectSkillProfiles.map((project) => project.name)).toEqual(['LInC One', 'EurekaVault']);
    expect(projectSkillProfiles.every((project) => project.skills.length >= 80)).toBe(true);
  });

  it('orders higher-priority evidence before granular details', () => {
    for (const project of projectSkillProfiles) {
      const priorities = project.skills.map((skill) => rank[skill.priority]);
      expect(priorities.every((value, index) => index === 0 || value >= priorities[index - 1]!)).toBe(true);
    }
  });

  it('does not repeat skill labels within a project', () => {
    for (const project of projectSkillProfiles) {
      expect(new Set(project.skills.map((skill) => skill.label)).size).toBe(project.skills.length);
    }
  });
});
