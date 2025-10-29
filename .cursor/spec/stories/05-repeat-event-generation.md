# 반복 일정 생성 로직 설계

## 📋 개요
반복 설정에 따라 실제 이벤트 인스턴스를 생성하는 핵심 로직을 설계합니다.

## 🎯 목적
- 반복 설정(매일/매주/매월/매년)에 따라 이벤트 생성
- 특수 케이스 처리 (31일, 윤년 2월 29일)
- 2025-12-31까지 생성 제한
- 반복 일정 겹침은 고려하지 않음

## 📥 입력 (Input)

```typescript
interface RepeatEventGenerationInput {
  baseEvent: EventForm;  // 기본 이벤트 데이터
  repeat: {
    type: RepeatType;    // 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number;    // 반복 간격
    endDate?: string;    // 종료일 (최대 2025-12-31)
  };
}
```

## ⚙️ 처리 로직 (Process)

### 1. 유틸리티 함수 생성 (`src/utils/repeatUtils.ts`)

```typescript
import { EventForm, RepeatType } from '../types';

const MAX_END_DATE = new Date('2025-12-31');

/**
 * 반복 일정 생성
 */
export function generateRepeatEvents(
  baseEvent: EventForm
): EventForm[] {
  if (baseEvent.repeat.type === 'none') {
    return [];
  }

  const events: EventForm[] = [];
  const startDate = new Date(baseEvent.date);
  const endDate = baseEvent.repeat.endDate 
    ? new Date(baseEvent.repeat.endDate) 
    : MAX_END_DATE;

  let currentDate = new Date(startDate);
  let count = 0;
  const MAX_ITERATIONS = 1000; // 무한 루프 방지

  while (currentDate <= endDate && count < MAX_ITERATIONS) {
    const eventDate = formatDate(currentDate);
    
    events.push({
      ...baseEvent,
      date: eventDate,
    });

    currentDate = getNextRepeatDate(
      currentDate,
      baseEvent.repeat.type,
      baseEvent.repeat.interval,
      startDate
    );
    
    count++;
  }

  return events;
}

/**
 * 다음 반복 날짜 계산
 */
function getNextRepeatDate(
  current: Date,
  type: RepeatType,
  interval: number,
  originalDate: Date
): Date {
  const next = new Date(current);

  switch (type) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;

    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      break;

    case 'monthly':
      return getNextMonthlyDate(current, interval, originalDate);

    case 'yearly':
      return getNextYearlyDate(current, interval, originalDate);

    default:
      break;
  }

  return next;
}

/**
 * 매월 반복 날짜 계산
 * 31일 규칙: 31일이 있는 달에만 생성
 */
function getNextMonthlyDate(
  current: Date,
  interval: number,
  original: Date
): Date {
  const originalDay = original.getDate();
  let next = new Date(current);
  let attempts = 0;
  const MAX_ATTEMPTS = 24; // 최대 2년

  while (attempts < MAX_ATTEMPTS) {
    next.setMonth(next.getMonth() + interval);
    
    // 해당 월의 마지막 날 확인
    const daysInMonth = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0
    ).getDate();

    // 원본 날짜가 해당 월에 존재하는 경우
    if (originalDay <= daysInMonth) {
      next.setDate(originalDay);
      break;
    }
    
    attempts++;
  }

  return next;
}

/**
 * 매년 반복 날짜 계산
 * 윤년 2/29 규칙: 윤년에만 생성
 */
function getNextYearlyDate(
  current: Date,
  interval: number,
  original: Date
): Date {
  const originalMonth = original.getMonth();
  const originalDay = original.getDate();
  let next = new Date(current);
  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  // 윤년 2월 29일 체크
  const isLeapDayOriginal = originalMonth === 1 && originalDay === 29;

  while (attempts < MAX_ATTEMPTS) {
    next.setFullYear(next.getFullYear() + interval);

    if (isLeapDayOriginal) {
      // 윤년인지 확인
      if (isLeapYear(next.getFullYear())) {
        next.setMonth(1);
        next.setDate(29);
        break;
      }
    } else {
      next.setMonth(originalMonth);
      next.setDate(originalDay);
      break;
    }
    
    attempts++;
  }

  return next;
}

/**
 * 윤년 판별
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * 날짜 포맷 (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

### 2. API 통합 (클라이언트 → 서버)

```typescript
// 저장 시 클라이언트에서 인스턴스 생성 후 일괄 저장
const instances = generateRepeatEvents(baseEvent);
await fetch('/api/events-list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ events: instances }),
});

// 서버는 각 이벤트에 id를, 반복 시리즈에는 공통 repeat.id를 부여하여 응답
```

## 📤 출력 (Output)

### 예시: 매주 반복
```typescript
// Input
{
  title: "주간 회의",
  date: "2025-01-06",
  repeat: { type: "weekly", interval: 1, endDate: "2025-01-31" }
}

// Output: 4개 생성(서버 저장 후 각 이벤트에 id와 repeat.id 부여)
[
  { id: "...", date: "2025-01-06", repeat: { type: 'weekly', interval: 1, id: "series-1" }, ... },
  { id: "...", date: "2025-01-13", repeat: { type: 'weekly', interval: 1, id: "series-1" }, ... },
  { id: "...", date: "2025-01-20", repeat: { type: 'weekly', interval: 1, id: "series-1" }, ... },
  { id: "...", date: "2025-01-27", repeat: { type: 'weekly', interval: 1, id: "series-1" }, ... },
]
```

### 예시: 매월 31일 (특수 케이스)
```typescript
// Input: 2025-01-31부터 매월
// Output: 31일이 있는 달만
[
  { date: "2025-01-31" },
  { date: "2025-03-31" },
  { date: "2025-05-31" },
  { date: "2025-07-31" },
  { date: "2025-08-31" },
  { date: "2025-10-31" },
  { date: "2025-12-31" },
]
// 2월, 4월, 6월, 9월, 11월은 생략
```

### 예시: 윤년 2월 29일 (특수 케이스)
```typescript
// Input: 2024-02-29부터 매년
// Output: 윤년만
[
  { date: "2024-02-29" },
  // 2025년 생략 (평년)
]
```

## 📁 영향받는 파일

### 새로 생성
1. ✨ `src/utils/repeatUtils.ts` - 반복 로직 유틸리티
2. ✨ `src/__tests__/unit/easy.repeatUtils.spec.ts` - 단위 테스트

### 수정 필요
3. 🔧 `server.js` - 반복 일정 생성 통합
4. 🔧 `src/hooks/useEventOperations.ts` - 클라이언트 생성 로직 (선택)

## 🚨 고려사항

### 생성 위치
**서버 측 생성 (권장)**
- 장점: 일관성, 클라이언트 부담 감소
- 단점: 서버 부하

**클라이언트 측 생성 (대안)**
- 장점: 서버 부하 감소
- 단점: 일관성 유지 어려움

### 성능
- 최대 생성 개수: 365개 (매일, 1년)
- 무한 루프 방지: MAX_ITERATIONS 제한
- 효율적인 날짜 계산 알고리즘

### 반복 일정 조회 최적화
```typescript
// 뷰 렌더링 시 필터링
const visibleEvents = events.filter(event => {
  const eventDate = new Date(event.date);
  return eventDate >= viewStartDate && eventDate <= viewEndDate;
});
```

## ✅ 검증 방법

### 단위 테스트
```typescript
describe('반복 일정 생성', () => {
  test('매일 반복', () => {
    const events = generateRepeatEvents({
      date: '2025-01-01',
      repeat: { type: 'daily', interval: 1, endDate: '2025-01-07' },
      // ...
    });
    
    expect(events).toHaveLength(7);
  });

  test('매월 31일 - 31일 있는 달만', () => {
    const events = generateRepeatEvents({
      date: '2025-01-31',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      // ...
    });
    
    expect(events).toHaveLength(7); // 1,3,5,7,8,10,12월
    expect(events.find(e => e.date === '2025-02-28')).toBeUndefined();
  });

  test('윤년 2월 29일 - 윤년만', () => {
    const events = generateRepeatEvents({
      date: '2024-02-29',
      repeat: { type: 'yearly', interval: 1, endDate: '2025-12-31' },
      // ...
    });
    
    expect(events).toHaveLength(1); // 2024년만
  });
});
```

## 🔗 관련 기능
- [반복 일정 생성](./01-repeat-event-creation.md)
- [반복 일정 표시](./02-repeat-event-display.md)

