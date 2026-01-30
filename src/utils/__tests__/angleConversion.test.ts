import { describe, it, expect } from 'vitest';
import { radToDeg, degToRad } from '../angleConversion';

describe('angleConversion', () => {
  describe('radToDeg', () => {
    it('converts 0 radians to 0 degrees', () => {
      expect(radToDeg(0)).toBe(0);
    });

    it('converts PI radians to 180 degrees', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });

    it('converts PI/2 radians to 90 degrees', () => {
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    it('converts 2*PI radians to 360 degrees', () => {
      expect(radToDeg(Math.PI * 2)).toBeCloseTo(360);
    });

    it('converts negative radians correctly', () => {
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180);
    });
  });

  describe('degToRad', () => {
    it('converts 0 degrees to 0 radians', () => {
      expect(degToRad(0)).toBe(0);
    });

    it('converts 180 degrees to PI radians', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    it('converts 90 degrees to PI/2 radians', () => {
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    it('converts 360 degrees to 2*PI radians', () => {
      expect(degToRad(360)).toBeCloseTo(Math.PI * 2);
    });

    it('converts negative degrees correctly', () => {
      expect(degToRad(-180)).toBeCloseTo(-Math.PI);
    });
  });

  describe('roundtrip conversion', () => {
    it('degToRad(radToDeg(x)) returns x', () => {
      const values = [0, Math.PI / 4, Math.PI / 2, Math.PI, 1.5];
      for (const val of values) {
        expect(degToRad(radToDeg(val))).toBeCloseTo(val);
      }
    });

    it('radToDeg(degToRad(x)) returns x', () => {
      const values = [0, 45, 90, 180, 270, 360];
      for (const val of values) {
        expect(radToDeg(degToRad(val))).toBeCloseTo(val);
      }
    });
  });
});
