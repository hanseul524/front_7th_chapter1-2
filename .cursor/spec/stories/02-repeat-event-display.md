# 반복 일정 표시 기능 설계

## 📋 개요
캘린더 뷰에서 반복 일정을 아이콘으로 구분하여 표시하는 기능을 설계합니다.

## 🎯 목적
- 캘린더(월/주 뷰)에서 반복 일정 시각적 구분
- 일정 목록에서 반복 아이콘 표시
- 사용자가 한눈에 반복 일정을 식별할 수 있도록 함

## 📥 입력 (Input)

### 데이터 소스
```typescript
interface Event {
  id: string;
  title: string;
  date: string;
  repeat: {
    type: RepeatType;  // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number;
    endDate?: string;
  };
  // ... 기타 필드
}

// 반복 일정 판별 조건
const isRepeatingEvent = event.repeat.type !== 'none';
```

### 뷰 타입
- 월간 뷰 (Month View)
- 주간 뷰 (Week View)
- 일정 목록 (Event List)

## ⚙️ 처리 로직 (Process)

### 1. 아이콘 선택

Material-UI Icons 사용:
```typescript
import { Repeat, Notifications } from '@mui/icons-material';

// 아이콘 선택 기준:
// - Repeat: 반복 일정을 나타내는 보편적인 아이콘
// - 크기: small (기존 Notifications 아이콘과 통일)
// - 색상: 테마 색상 사용 (primary 또는 기본 색상)
```

### 2. 유틸리티 함수 추가

`src/utils/eventUtils.ts` 수정:

```typescript
/**
 * 이벤트가 반복 일정인지 확인
 */
export function isRepeatingEvent(event: Event): boolean {
  return event.repeat.type !== 'none';
}

/**
 * 반복 유형을 한글로 변환
 */
export function getRepeatTypeLabel(type: RepeatType): string {
  const labels: Record<RepeatType, string> = {
    none: '없음',
    daily: '매일',
    weekly: '매주',
    monthly: '매월',
    yearly: '매년',
  };
  return labels[type];
}

/**
 * 반복 일정 요약 텍스트 생성
 * 예: "매주 반복", "2일마다 반복 (종료: 2025-12-31)"
 */
export function getRepeatSummary(repeat: RepeatInfo): string {
  if (repeat.type === 'none') return '';
  
  const typeLabel = getRepeatTypeLabel(repeat.type);
  const intervalText = repeat.interval > 1 
    ? `${repeat.interval}${getIntervalUnit(repeat.type)}마다` 
    : typeLabel;
  const endDateText = repeat.endDate ? ` (종료: ${repeat.endDate})` : '';
  
  return `${intervalText} 반복${endDateText}`;
}

function getIntervalUnit(type: RepeatType): string {
  switch (type) {
    case 'daily': return '일';
    case 'weekly': return '주';
    case 'monthly': return '월';
    case 'yearly': return '년';
    default: return '';
  }
}
```

### 3. App.tsx 수정

#### 3.1 월간 뷰 (renderMonthView)

```typescript
{getEventsForDay(filteredEvents, day).map((event) => {
  const isNotified = notifiedEvents.includes(event.id);
  const isRepeating = isRepeatingEvent(event);  // 추가
  
  return (
    <Box
      key={event.id}
      sx={{
        p: 0.5,
        my: 0.5,
        backgroundColor: isNotified ? 'error.lighter' : 'background.default',
        borderRadius: 1,
        fontWeight: isNotified ? 'bold' : 'normal',
        color: isNotified ? 'error.main' : 'text.primary',
        minHeight: '18px',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        {isNotified && <Notifications fontSize="small" />}
        {isRepeating && (  // 추가
          <Repeat 
            fontSize="small" 
            sx={{ color: 'primary.main' }}
            aria-label="반복 일정"
          />
        )}
        <Typography
          variant="caption"
          noWrap
          sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
        >
          {event.title}
        </Typography>
      </Stack>
    </Box>
  );
})}
```

#### 3.2 주간 뷰 (renderWeekView)

```typescript
{filteredEvents
  .filter((event) => event.date === formatDate(date))
  .map((event) => {
    const isNotified = notifiedEvents.includes(event.id);
    const isRepeating = isRepeatingEvent(event);  // 추가
    
    return (
      <Box
        key={event.id}
        sx={{
          p: 0.5,
          my: 0.5,
          backgroundColor: isNotified ? 'error.lighter' : 'background.default',
          borderRadius: 1,
          fontWeight: isNotified ? 'bold' : 'normal',
          color: isNotified ? 'error.main' : 'text.primary',
          minHeight: '18px',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          {isNotified && <Notifications fontSize="small" />}
          {isRepeating && (  // 추가
            <Repeat 
              fontSize="small" 
              sx={{ color: 'primary.main' }}
              aria-label="반복 일정"
            />
          )}
          <Typography
            variant="caption"
            noWrap
            sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}
          >
            {event.title}
          </Typography>
        </Stack>
      </Box>
    );
  })}
```

#### 3.3 일정 목록 (Event List)

```typescript
{filteredEvents.map((event) => (
  <Box key={event.id} sx={{ border: 1, borderRadius: 2, p: 3, width: '100%' }}>
    <Stack direction="row" justifyContent="space-between">
      <Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {notifiedEvents.includes(event.id) && <Notifications color="error" />}
          {isRepeatingEvent(event) && (  // 추가
            <Repeat color="primary" aria-label="반복 일정" />
          )}
          <Typography
            fontWeight={notifiedEvents.includes(event.id) ? 'bold' : 'normal'}
            color={notifiedEvents.includes(event.id) ? 'error' : 'inherit'}
          >
            {event.title}
          </Typography>
        </Stack>
        <Typography>{event.date}</Typography>
        <Typography>
          {event.startTime} - {event.endTime}
        </Typography>
        <Typography>{event.description}</Typography>
        <Typography>{event.location}</Typography>
        <Typography>카테고리: {event.category}</Typography>
        
        {/* 기존 반복 정보 표시 개선 */}
        {event.repeat.type !== 'none' && (
          <Typography sx={{ color: 'primary.main', fontWeight: 'medium' }}>
            {getRepeatSummary(event.repeat)}
          </Typography>
        )}
        
        <Typography>
          알림:{' '}
          {notificationOptions.find((option) => option.value === event.notificationTime)?.label}
        </Typography>
      </Stack>
      {/* ... Edit/Delete 버튼 */}
    </Stack>
  </Box>
))}
```

### 4. Import 추가

```typescript
// App.tsx 상단
import { Repeat, Notifications, ChevronLeft, ... } from '@mui/icons-material';
import { isRepeatingEvent, getRepeatSummary } from './utils/eventUtils';
import { formatDate } from './utils/dateUtils';
```

## 📤 출력 (Output)

### 시각적 표현

#### 월간/주간 뷰
```
[🔔] [🔁] 주간 회의        <- 알림 + 반복 일정
[🔁] 팀 스탠드업          <- 반복 일정만
[🔔] 의사 예약            <- 알림만
일반 회의                 <- 일반 일정
```

#### 일정 목록 상세
```
┌─────────────────────────────────┐
│ 🔔 🔁 주간 회의                │
│ 2025-01-06                      │
│ 10:00 - 11:00                   │
│ 정기 주간 회의                  │
│ 회의실 A                        │
│ 카테고리: 업무                  │
│ 매주 반복 (종료: 2025-12-31)   │ <- 개선된 표시
│ 알림: 10분 전                   │
└─────────────────────────────────┘
```

### 접근성 (Accessibility)
```typescript
// 스크린 리더를 위한 aria-label
<Repeat 
  fontSize="small" 
  sx={{ color: 'primary.main' }}
  aria-label="반복 일정"
/>

// Tooltip 추가 (선택사항)
<Tooltip title={getRepeatSummary(event.repeat)}>
  <Repeat fontSize="small" sx={{ color: 'primary.main' }} />
</Tooltip>
```

## 📁 영향받는 파일

### 수정 필요
1. 🔧 `src/App.tsx` - 아이콘 추가 및 표시 로직
2. 🔧 `src/utils/eventUtils.ts` - 유틸리티 함수 추가

### 테스트 파일 수정
3. 🔧 `src/__tests__/unit/easy.eventUtils.spec.ts` - 테스트 추가

## 🚨 고려사항

### 아이콘 배치 순서
```typescript
// 우선순위: 알림 > 반복
<Stack direction="row" spacing={0.5} alignItems="center">
  {isNotified && <Notifications fontSize="small" />}
  {isRepeating && <Repeat fontSize="small" />}
  <Typography>{event.title}</Typography>
</Stack>
```

### 공간 제약
- 캘린더 셀이 작을 때 아이콘이 너무 많으면 제목이 잘릴 수 있음
- 해결: `spacing={0.5}` 사용, `noWrap` 속성으로 제목 말줄임 처리

### 색상 일관성
```typescript
// 반복 아이콘: primary.main
// 알림 아이콘: error.main
// 배경: 알림 시 error.lighter, 일반 background.default

// 충돌 방지: 배경색은 알림 상태 우선
backgroundColor: isNotified ? 'error.lighter' : 'background.default'
```

### 성능 최적화
```typescript
// 유틸리티 함수를 컴포넌트 외부로 분리
// 불필요한 재계산 방지
const isRepeating = useMemo(
  () => isRepeatingEvent(event),
  [event.repeat.type]
);
```

### 반응형 고려
- 모바일: 아이콘 크기 유지, 제목 더 짧게 표시
- 태블릿/데스크톱: 현재 디자인 유지

## ✅ 검증 방법

### 단위 테스트
```typescript
describe('반복 일정 유틸리티', () => {
  test('반복 일정 판별', () => {
    const repeatingEvent: Event = { 
      /* ... */ 
      repeat: { type: 'weekly', interval: 1 } 
    };
    expect(isRepeatingEvent(repeatingEvent)).toBe(true);
    
    const normalEvent: Event = { 
      /* ... */ 
      repeat: { type: 'none', interval: 1 } 
    };
    expect(isRepeatingEvent(normalEvent)).toBe(false);
  });
  
  test('반복 요약 텍스트 생성', () => {
    expect(getRepeatSummary({ 
      type: 'weekly', 
      interval: 1 
    })).toBe('매주 반복');
    
    expect(getRepeatSummary({ 
      type: 'daily', 
      interval: 2,
      endDate: '2025-12-31'
    })).toBe('2일마다 반복 (종료: 2025-12-31)');
  });
});
```

### 통합 테스트
```typescript
test('캘린더에서 반복 일정 아이콘 표시', async () => {
  const repeatingEvent: Event = {
    id: '1',
    title: '주간 회의',
    date: '2025-01-06',
    repeat: { type: 'weekly', interval: 1 },
    // ...
  };
  
  render(<App />);
  
  // 반복 아이콘 확인
  const repeatIcons = screen.getAllByLabelText('반복 일정');
  expect(repeatIcons.length).toBeGreaterThan(0);
});
```

### 수동 테스트 체크리스트
- [ ] 월간 뷰에서 반복 아이콘 표시 확인
- [ ] 주간 뷰에서 반복 아이콘 표시 확인
- [ ] 일정 목록에서 반복 아이콘 및 요약 텍스트 확인
- [ ] 알림 + 반복 일정의 경우 두 아이콘 모두 표시 확인
- [ ] 아이콘 색상 및 크기 일관성 확인
- [ ] 스크린 리더로 aria-label 읽기 확인

## 🔗 관련 기능
- [반복 일정 생성](./01-repeat-event-creation.md)
- [반복 일정 생성 로직](./05-repeat-event-generation.md)
- [반복 일정 수정](./03-repeat-event-update.md)

