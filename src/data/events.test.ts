import { describe, expect, it } from 'vitest';
import { EVENT_CATEGORIES, EVENT_TEMPLATES } from './events';
import { getItem } from './items';
import { getTrait } from './traits';

describe('event catalog', () => {
  it('holds at least 40 templates', () => {
    expect(EVENT_TEMPLATES.length).toBeGreaterThanOrEqual(40);
  });

  it('uses unique ids', () => {
    const ids = EVENT_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every category', () => {
    EVENT_CATEGORIES.forEach((category) => {
      expect(
        EVENT_TEMPLATES.some((template) => template.category === category),
      ).toBe(true);
    });
  });

  it('keeps at least 5 quiet days available', () => {
    const quiet = EVENT_TEMPLATES.filter(
      (template) => template.category === '정적',
    );
    expect(quiet.length).toBeGreaterThanOrEqual(5);
  });

  it('gives quiet days enough weight to actually appear', () => {
    const total = EVENT_TEMPLATES.reduce(
      (sum, template) => sum + template.weight,
      0,
    );
    const quiet = EVENT_TEMPLATES.filter(
      (template) => template.category === '정적',
    ).reduce((sum, template) => sum + template.weight, 0);

    expect(quiet / total).toBeGreaterThan(0.15);
  });

  it('gives every template a positive weight and real text', () => {
    EVENT_TEMPLATES.forEach((template) => {
      expect(template.weight).toBeGreaterThan(0);
      expect(template.text.length).toBeGreaterThan(4);
    });
  });

  it('only names two survivors when the cast allows it', () => {
    EVENT_TEMPLATES.forEach((template) => {
      if (template.text.includes('{상대}')) {
        expect(template.cast).toBe(2);
      }
    });
  });

  it('requires at least two survivors whenever it names two', () => {
    EVENT_TEMPLATES.forEach((template) => {
      if (template.cast !== 2) return;
      expect(template.requirements?.minSurvivors ?? 0).toBeGreaterThanOrEqual(2);
    });
  });

  it('only references items that exist', () => {
    EVENT_TEMPLATES.forEach((template) => {
      const required = template.requirements?.requiredItem;
      if (required !== undefined) {
        expect(getItem(required)).toBeDefined();
      }
      template.effects?.items?.forEach((change) => {
        expect(getItem(change.itemId)).toBeDefined();
      });
    });
  });

  it('only references traits that exist', () => {
    EVENT_TEMPLATES.forEach((template) => {
      const trait = template.requirements?.requiredTrait;
      if (trait !== undefined) {
        expect(getTrait(trait)).toBeDefined();
      }
    });
  });

  it('uses only the three documented slots', () => {
    const slotPattern = /\{([^}]+)\}/g;
    EVENT_TEMPLATES.forEach((template) => {
      const matches = template.text.matchAll(slotPattern);
      for (const match of matches) {
        expect(['생존자', '상대', '아이템']).toContain(match[1]);
      }
    });
  });

  it('unlocks conflict below -60 and sacrifice above +60', () => {
    const conflict = EVENT_TEMPLATES.filter(
      (template) => template.requirements?.maxTrust !== undefined,
    );
    const sacrifice = EVENT_TEMPLATES.filter(
      (template) => template.requirements?.minTrust !== undefined,
    );

    expect(conflict.length).toBeGreaterThan(0);
    expect(sacrifice.length).toBeGreaterThan(0);
    conflict.forEach((template) => {
      expect(template.requirements?.maxTrust).toBeLessThanOrEqual(-60);
    });
    sacrifice.forEach((template) => {
      expect(template.requirements?.minTrust).toBeGreaterThanOrEqual(61);
    });
  });
});

describe('dialogue', () => {
  const withDialogue = EVENT_TEMPLATES.filter(
    (template) => template.dialogue !== undefined,
  );

  it('gives a good share of the catalogue a voice', () => {
    expect(withDialogue.length).toBeGreaterThanOrEqual(20);
  });

  it('leaves some events unspoken so the log still breathes', () => {
    expect(withDialogue.length).toBeLessThan(EVENT_TEMPLATES.length);
  });

  it('offers more than one line per event', () => {
    withDialogue.forEach((template) => {
      expect(template.dialogue?.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('writes speech, not narration', () => {
    withDialogue.forEach((template) => {
      template.dialogue?.forEach((line) => {
        expect(line.length).toBeGreaterThan(2);
        // Slots belong in narration; a spoken line names nobody.
        expect(line).not.toContain('{생존자}');
        expect(line).not.toContain('{상대}');
        // The renderer adds the quotation marks.
        expect(line.startsWith('"')).toBe(false);
      });
    });
  });

  /*
   * `{호칭}` is the one slot speech may use, and it is how the age field
   * reaches the log at all — Korean has no neutral second person, so a
   * catalogue with no forms of address throws age away. It needs somebody to
   * address, so it only belongs in a two-hander.
   */
  it('only addresses somebody when there is somebody to address', () => {
    withDialogue.forEach((template) => {
      template.dialogue?.forEach((line) => {
        if (!line.includes('{호칭}')) return;
        expect(template.cast).toBe(2);
      });
    });
  });

  it('actually uses forms of address', () => {
    const addressing = withDialogue.filter((template) =>
      template.dialogue?.some((line) => line.includes('{호칭}')),
    );
    expect(addressing.length).toBeGreaterThanOrEqual(10);
  });

  it('keeps every line short enough to be said out loud', () => {
    withDialogue.forEach((template) => {
      template.dialogue?.forEach((line) => {
        expect(line.length).toBeLessThan(45);
      });
    });
  });
});
