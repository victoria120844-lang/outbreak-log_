import { describe, expect, it } from 'vitest';
import { DRAW_DURATION, IMPACT_AT, shouldPlayIntro } from './ShatterIntro';
import { IMPACT, buildCore, buildCracks } from './shatterCracks';

describe('shouldPlayIntro', () => {
  it('plays for a visitor who has not seen it this session', () => {
    expect(shouldPlayIntro('', null)).toBe(true);
  });

  it('stays out of the way once it has played', () => {
    expect(shouldPlayIntro('', '1')).toBe(false);
  });

  it('replays when forced with ?intro=1', () => {
    expect(shouldPlayIntro('?intro=1', '1')).toBe(true);
  });

  it('ignores other query params', () => {
    expect(shouldPlayIntro('?intro=0&other=1', '1')).toBe(false);
    expect(shouldPlayIntro('?seed=42', '1')).toBe(false);
  });
});

describe('timing', () => {
  it('holds the wordmark for three seconds before the hit', () => {
    expect(IMPACT_AT).toBe(3000);
  });

  it('fractures fast — glass does not creep', () => {
    expect(DRAW_DURATION).toBeLessThanOrEqual(700);
  });
});
describe('crack geometry', () => {
  const cracks = buildCracks();

  it('is the same pattern every time', () => {
    expect(buildCracks().map((crack) => crack.points)).toEqual(
      cracks.map((crack) => crack.points),
    );
  });

  it('draws a dense web rather than a handful of lines', () => {
    expect(cracks.length).toBeGreaterThan(40);
  });

  it('ships filled wedges, not strokes', () => {
    // A stroke has one width for its whole length. The reference does not:
    // every crack is wide at the impact and a point at the tip, which only a
    // polygon can express. Each outline is two sides of the same spine.
    cracks.forEach((crack) => {
      const corners = crack.points.split(' ');
      expect(corners.length).toBeGreaterThanOrEqual(6);
      expect(corners.length % 2).toBe(0);
    });
  });

  it('writes valid coordinates', () => {
    cracks.forEach((crack) => {
      expect(crack.points).not.toContain('NaN');
      crack.points.split(' ').forEach((corner) => {
        const [x, y] = corner.split(',').map(Number);
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
      });
    });
  });

  it('keeps every crack visible but never flat white', () => {
    cracks.forEach((crack) => {
      expect(crack.opacity).toBeGreaterThan(0.4);
      expect(crack.opacity).toBeLessThanOrEqual(1);
    });
  });

  it('lands the whole web inside the first quarter second', () => {
    cracks.forEach((crack) => {
      expect(crack.delay).toBeGreaterThanOrEqual(0);
      expect(crack.delay).toBeLessThanOrEqual(260);
    });
  });

  it('roots the radials at the impact point', () => {
    const near = cracks.filter((crack) => {
      const [x, y] = (crack.points.split(' ')[0] ?? '').split(',').map(Number);
      return (
        Math.abs((x ?? 0) - IMPACT.x) < 1.6 && Math.abs((y ?? 0) - IMPACT.y) < 1.6
      );
    });
    expect(near.length).toBeGreaterThanOrEqual(14);
  });
});

describe('the impact core', () => {
  it('is a ragged star, not a circle', () => {
    const corners = buildCore().split(' ');
    expect(corners.length).toBeGreaterThanOrEqual(20);

    const radii = corners.map((corner) => {
      const [x, y] = corner.split(',').map(Number);
      return Math.sqrt(((x ?? 0) - IMPACT.x) ** 2 + ((y ?? 0) - IMPACT.y) ** 2);
    });
    // Alternating spikes: the longest reaches well past the shortest.
    expect(Math.max(...radii)).toBeGreaterThan(Math.min(...radii) * 2.5);
  });

  it('is the same star every time', () => {
    expect(buildCore()).toBe(buildCore());
  });
});
