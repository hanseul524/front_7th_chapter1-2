/**
 * 반복 종료일이 유효한지 검증
 * @param startDate - 일정 시작일 (YYYY-MM-DD)
 * @param endDate - 반복 종료일 (YYYY-MM-DD)
 * @returns 에러 메시지 또는 null
 */
export function validateRepeatEndDate(startDate: string, endDate: string): string | null {
  if (!endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const maxDate = new Date('2025-12-31');

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '유효한 날짜 형식이 아닙니다.';
  }

  if (end < start) {
    return '반복 종료일은 시작일 이후여야 합니다.';
  }

  if (end > maxDate) {
    return '반복 종료일은 2025-12-31 이전이어야 합니다.';
  }

  return null;
}

/**
 * 반복 간격이 유효한지 검증
 * @param interval - 반복 간격 (정수)
 * @returns 에러 메시지 또는 null
 */
export function validateRepeatInterval(interval: number): string | null {
  if (interval < 1) {
    return '반복 간격은 1 이상이어야 합니다.';
  }
  if (interval > 999) {
    return '반복 간격은 999 이하여야 합니다.';
  }
  return null;
}
