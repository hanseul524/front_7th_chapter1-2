import { describe, it, expect } from 'vitest';

import { validateRepeatEndDate, validateRepeatInterval } from '../../utils/repeatValidation.ts';

describe('반복 일정 유효성 검증', () => {
  it('반복 종료일이 시작일보다 이전이면 에러', () => {
    const error = validateRepeatEndDate('2025-12-31', '2025-01-01');
    expect(error).toBe('반복 종료일은 시작일 이후여야 합니다.');
  });

  it('반복 종료일이 2025-12-31 이후면 에러', () => {
    const error = validateRepeatEndDate('2025-01-01', '2026-01-01');
    expect(error).toBe('반복 종료일은 2025-12-31 이전이어야 합니다.');
  });

  it('반복 종료일이 유효하면 null을 반환', () => {
    const error = validateRepeatEndDate('2025-01-01', '2025-12-31');
    expect(error).toBeNull();
  });

  it('반복 간격이 1 미만이면 에러', () => {
    const error = validateRepeatInterval(0);
    expect(error).toBe('반복 간격은 1 이상이어야 합니다.');
  });

  it('반복 간격이 999 초과면 에러', () => {
    const error = validateRepeatInterval(1000);
    expect(error).toBe('반복 간격은 999 이하여야 합니다.');
  });

  it('반복 간격이 유효하면 null을 반환', () => {
    const error = validateRepeatInterval(1);
    expect(error).toBeNull();
  });
});
