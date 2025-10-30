import { describe, it, expect } from 'vitest';

import { getEffectiveEndDate } from '../../utils/repeatGeneration.ts';

/**
 * 반복 종료일 기본값 유틸 테스트
 * - 종료일 미입력 시 2025-12-31 적용
 * - 종료일 입력 시 해당 값 그대로 사용
 */
describe('getEffectiveEndDate', () => {
  it('종료일 미입력 시 2025-12-31을 반환해야 한다', () => {
    const result = getEffectiveEndDate(undefined);
    expect(result).toBe('2025-12-31');
  });

  it('종료일이 주어지면 해당 값을 그대로 반환해야 한다', () => {
    const result = getEffectiveEndDate('2025-06-30');
    expect(result).toBe('2025-06-30');
  });
});
