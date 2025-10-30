import { describe, it, expect } from 'vitest';

import { clampToSystemMaxEndDate } from '../../utils/repeatGeneration.ts';

/**
 * 시스템 최대 종료일(2025-12-31) 클램프 유틸 테스트
 */
describe('clampToSystemMaxEndDate', () => {
  it('종료일이 비어있으면 2025-12-31을 반환한다', () => {
    expect(clampToSystemMaxEndDate(undefined)).toBe('2025-12-31');
  });

  it('종료일이 2025-12-31을 초과하면 2025-12-31로 클램프한다', () => {
    expect(clampToSystemMaxEndDate('2026-01-01')).toBe('2025-12-31');
  });

  it('종료일이 한도 이하이면 그대로 반환한다', () => {
    expect(clampToSystemMaxEndDate('2025-12-15')).toBe('2025-12-15');
  });
});
