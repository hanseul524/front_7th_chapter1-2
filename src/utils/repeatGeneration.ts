import { EventForm } from '../types';

export const MAX_REPEAT_END_DATE = '2025-12-31' as const;

/**
 * 'YYYY-MM-DD' 문자열을 UTC 날짜 파트로 파싱합니다.
 * @param dateStr - ISO 날짜 문자열(YYYY-MM-DD)
 */
function toDateParts(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map((v) => Number(v));
  return { y, m, d };
}

/** UTC 기준의 time key를 생성합니다. */
function toDateKeyUTC(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

/** 연·월·일을 ISO 형식 문자열로 변환합니다. */
function toISO(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/** 윤년 여부를 반환합니다. */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// 월 일수 테이블 기반 판단으로 대체하여 별도 상수 불필요

/** 해당 월의 일수를 UTC 기준으로 반환합니다. */
function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * seed 이벤트로부터 반복 인스턴스(EventForm[])를 생성합니다.
 * 규칙:
 * - monthly: 시작일 D가 해당 월에 존재할 때만 생성(보정 생성 금지)
 * - yearly: 2/29 시작이면 윤년에만 생성; 평년 2/28 시작이면 평년에만 생성
 * - endDate가 존재하면 해당 날짜(포함)까지만 생성
 * - daily/weekly는 최소 구현으로 시작일만 생성(추후 증분 필요 시 확장)
 * @param seed - 반복 설정을 포함한 이벤트 폼
 * @returns 생성된 반복 인스턴스 목록(시드 포함)
 */
/**
 * 시스템 최대 종료일(2025-12-31)로 종료일을 클램프합니다.
 * @param repeatEndDate - 입력 종료일(YYYY-MM-DD) 또는 undefined
 * @returns 한도 이내 종료일(YYYY-MM-DD)
 */
export function clampToSystemMaxEndDate(repeatEndDate?: string): string {
  if (!repeatEndDate) return MAX_REPEAT_END_DATE;
  return repeatEndDate > MAX_REPEAT_END_DATE ? MAX_REPEAT_END_DATE : repeatEndDate;
}

/**
 * 유효한 종료일을 반환합니다(미입력/초과 시 시스템 한도로 보정).
 * @param repeatEndDate - 입력 종료일(YYYY-MM-DD) 또는 undefined
 * @returns 보정된 종료일(YYYY-MM-DD)
 */
export function getEffectiveEndDate(repeatEndDate?: string): string {
  return clampToSystemMaxEndDate(repeatEndDate);
}

export function generateRepeatEvents(seed: EventForm): EventForm[] {
  const { repeat } = seed;
  const interval = Math.max(1, repeat.interval || 1);
  const { y: sy, m: sm, d: sd } = toDateParts(seed.date);
  const effectiveEnd = getEffectiveEndDate(repeat.endDate);
  const end = toDateParts(effectiveEnd);
  const endKey = toDateKeyUTC(end.y, end.m, end.d);

  const result: EventForm[] = [];

  const pushIfInRange = (y: number, m: number, d: number) => {
    const key = toDateKeyUTC(y, m, d);
    if (key <= endKey) {
      result.push({ ...seed, date: toISO(y, m, d) });
    }
  };

  if (repeat.type === 'none') {
    result.push(seed);
    return result;
  }

  if (repeat.type === 'daily') {
    // 최소 구현: 시작일만 생성 (추후 필요 시 일 단위 증분 구현)
    pushIfInRange(sy, sm, sd);
    return result;
  }

  if (repeat.type === 'weekly') {
    // 최소 구현: 시작일만 생성 (추후 필요 시 주 단위 증분 구현)
    pushIfInRange(sy, sm, sd);
    return result;
  }

  if (repeat.type === 'monthly') {
    // 월 증분 반복
    let y = sy;
    let m = sm;
    // 반복: endDate까지
    while (toDateKeyUTC(y, m, sd) <= endKey) {
      const dim = getDaysInMonth(y, m);
      if (sd <= dim) {
        pushIfInRange(y, m, sd);
      }
      // 다음 회차
      m += interval;
      while (m > 12) {
        m -= 12;
        y += 1;
      }
    }
    return result;
  }

  if (repeat.type === 'yearly') {
    const seedIsFeb29 = sm === 2 && sd === 29;
    const seedIsCommonFeb28 = sm === 2 && sd === 28 && !isLeapYear(sy);
    let y = sy;
    while (toDateKeyUTC(y, sm, sd) <= endKey) {
      if (seedIsFeb29) {
        if (isLeapYear(y)) {
          pushIfInRange(y, 2, 29);
        }
      } else if (seedIsCommonFeb28) {
        if (!isLeapYear(y)) {
          pushIfInRange(y, 2, 28);
        }
      } else {
        const dim = getDaysInMonth(y, sm);
        if (sd <= dim) {
          pushIfInRange(y, sm, sd);
        }
      }
      y += interval;
    }
    return result;
  }

  // 기본 방어
  result.push(seed);
  return result;
}
