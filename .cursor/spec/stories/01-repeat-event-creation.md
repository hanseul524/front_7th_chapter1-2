# 반복 일정 생성 및 선택 기능 설계

## 📋 개요
사용자가 일정 생성 또는 수정 시 반복 유형(매일, 매주, 매월, 매년)을 선택할 수 있는 기능을 설계합니다.

## 🎯 목적
- 일정 생성/수정 폼에서 반복 유형을 선택할 수 있는 UI 제공
- 선택된 반복 유형에 따라 적절한 데이터 구조로 저장
- 반복 종료 조건 설정 (2025-12-31까지)

## 📥 입력 (Input)

### 사용자 입력
```typescript
interface RepeatFormInput {
  isRepeating: boolean;           // 반복 일정 여부
  repeatType: RepeatType;         // 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  repeatInterval: number;         // 반복 간격 (기본값: 1)
  repeatEndDate: string;          // 반복 종료일 (YYYY-MM-DD, 최대: 2025-12-31)
}
```

### 제약 조건
- `repeatType`: 매일, 매주, 매월, 매년 중 하나
- `repeatInterval`: 1 이상의 정수
- `repeatEndDate`: 현재 날짜 이후 ~ 2025-12-31 이내
- **31일에 매월 선택**: 31일이 있는 달에만 생성 (마지막 날 X)
- **윤년 2월 29일에 매년 선택**: 윤년 2월 29일에만 생성

## ⚙️ 처리 로직 (Process)

### 1. UI 컴포넌트 수정 (App.tsx)

```typescript
// 반복 일정 UI 활성화 (현재 주석 처리된 부분)
{isRepeating && (
  <Stack spacing={2}>
    <FormControl fullWidth>
      <FormLabel htmlFor="repeat-type">반복 유형</FormLabel>
      <Select
        id="repeat-type"
        size="small"
        value={repeatType}
        onChange={(e) => setRepeatType(e.target.value as RepeatType)}
        aria-label="반복 유형 선택"
      >
        <MenuItem value="daily">매일</MenuItem>
        <MenuItem value="weekly">매주</MenuItem>
        <MenuItem value="monthly">매월</MenuItem>
        <MenuItem value="yearly">매년</MenuItem>
      </Select>
    </FormControl>
    
    <FormControl fullWidth>
      <FormLabel htmlFor="repeat-interval">반복 간격</FormLabel>
      <TextField
        id="repeat-interval"
        size="small"
        type="number"
        value={repeatInterval}
        onChange={(e) => setRepeatInterval(Number(e.target.value))}
        slotProps={{ htmlInput: { min: 1, max: 999 } }}
        aria-label="반복 간격"
      />
    </FormControl>
    
    <FormControl fullWidth>
      <FormLabel htmlFor="repeat-end-date">반복 종료일</FormLabel>
      <TextField
        id="repeat-end-date"
        size="small"
        type="date"
        value={repeatEndDate}
        onChange={(e) => setRepeatEndDate(e.target.value)}
        slotProps={{ 
          htmlInput: { 
            min: date || new Date().toISOString().split('T')[0],
            max: '2025-12-31'
          } 
        }}
        aria-label="반복 종료일"
      />
    </FormControl>
  </Stack>
)}
```

### 2. 훅 수정 (useEventForm.ts)

현재 `useEventForm` 훅은 반복 관련 상태를 이미 가지고 있으므로, `setRepeatType`, `setRepeatInterval`, `setRepeatEndDate`를 반환 객체에 추가합니다.

```typescript
// 이미 구현되어 있지만, App.tsx에서 주석 처리되어 사용 안 함
return {
  // ... 기존 반환값
  setRepeatType,      // 활성화 필요
  setRepeatInterval,  // 활성화 필요
  setRepeatEndDate,   // 활성화 필요
};
```

### 3. 유효성 검증 추가

새로운 유틸리티 함수 생성: `src/utils/repeatValidation.ts`

```typescript
/**
 * 반복 종료일이 유효한지 검증
 * @param startDate - 일정 시작일
 * @param endDate - 반복 종료일
 * @returns 에러 메시지 또는 null
 */
export function validateRepeatEndDate(
  startDate: string,
  endDate: string
): string | null {
  if (!endDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const maxDate = new Date('2025-12-31');
  
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
```

## 📤 출력 (Output)

### 저장되는 데이터 구조
```typescript
interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  repeat: {
    type: RepeatType;        // 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number;        // 1, 2, 3, ...
    endDate?: string;        // 'YYYY-MM-DD' 또는 undefined
    id?: string;
  };
  notificationTime: number;
}
```

### API 요청 형식
```typescript
// 일반 일정 단건 생성
// POST /api/events
{
  "title": "회의",
  "date": "2025-01-01",
  "startTime": "10:00",
  "endTime": "11:00",
  "description": "정기 회의",
  "location": "회의실 A",
  "category": "업무",
  "repeat": { "type": "none", "interval": 1 },
  "notificationTime": 10
}

// 반복 일정 생성(저장 시 인스턴스 배열 생성 후 전송)
// POST /api/events-list
{
  "events": [
    {
      "title": "주간 회의",
      "date": "2025-01-06",
      "startTime": "10:00",
      "endTime": "11:00",
      "description": "정기 주간 회의",
      "location": "회의실 A",
      "category": "업무",
      "repeat": { "type": "weekly", "interval": 1, "endDate": "2025-12-31" },
      "notificationTime": 10
    }
    // ... generateRepeatEvents로 생성된 다른 날짜들
  ]
}

// 서버는 저장 시 각 이벤트에 id를 부여하고,
// 반복 일정인 경우 repeat.id(시리즈 식별자)를 공통으로 부여함
```

## 📁 영향받는 파일

### 수정 필요
1. ✅ `src/types.ts` - `RepeatInfo.id?` 필드 추가
2. 🔧 `src/App.tsx` - 주석 해제 및 UI 활성화
3. 🔧 `src/hooks/useEventForm.ts` - setter 함수 반환 활성화
4. ✨ `src/utils/repeatValidation.ts` - 새로 생성

### 테스트 파일 추가
5. ✨ `src/__tests__/unit/easy.repeatValidation.spec.ts` - 새로 생성

## 🚨 고려사항

### 특수 케이스 처리

#### 1. 매월 31일 선택
```typescript
// ❌ 잘못된 처리: 매월 마지막 날
// ✅ 올바른 처리: 31일이 있는 달에만 생성 (1, 3, 5, 7, 8, 10, 12월)

// 예시: 2025-01-31에 매월 반복 설정
// → 생성: 1/31, 3/31, 5/31, 7/31, 8/31, 10/31, 12/31
// → 생략: 2월, 4월, 6월, 9월, 11월
```

#### 2. 윤년 2월 29일 선택
```typescript
// 예시: 2024-02-29에 매년 반복 설정
// → 생성: 윤년에만 (2024-02-29)
// → 생략: 평년 (2025년은 생략)
```

#### 3. 반복 종료일 제한
```typescript
// 최대 반복 종료일: 2025-12-31
// 이후 날짜는 입력 불가 (HTML input max 속성 활용)
```

### UI/UX 고려사항
- 반복 일정 체크박스를 해제하면 반복 관련 필드 숨김
- 반복 간격 입력은 양의 정수만 허용
- 반복 종료일은 필수가 아님 (선택 사항)
- 날짜 선택기의 min/max 속성으로 유효하지 않은 날짜 입력 방지

### 성능/저장 전략
- 반복 일정은 저장 시점에 클라이언트에서 인스턴스 배열을 생성한 뒤 `/api/events-list`로 일괄 저장
- 서버는 각 인스턴스에 `id`를, 반복 시리즈에는 공통 `repeat.id`를 부여
- 조회 시에는 저장된 인스턴스를 그대로 사용(동적 계산 없음)
- 2025-12-31까지 최대 생성 가능한 일정 수:
  - 매일: 최대 365개
  - 매주: 최대 52개
  - 매월: 최대 12개
  - 매년: 1개

## ✅ 검증 방법

### 단위 테스트
```typescript
describe('반복 일정 유효성 검증', () => {
  test('반복 종료일이 시작일보다 이전이면 에러', () => {
    const error = validateRepeatEndDate('2025-12-31', '2025-01-01');
    expect(error).toBe('반복 종료일은 시작일 이후여야 합니다.');
  });
  
  test('반복 종료일이 2025-12-31 이후면 에러', () => {
    const error = validateRepeatEndDate('2025-01-01', '2026-01-01');
    expect(error).toBe('반복 종료일은 2025-12-31 이전이어야 합니다.');
  });
  
  test('반복 간격이 1 미만이면 에러', () => {
    const error = validateRepeatInterval(0);
    expect(error).toBe('반복 간격은 1 이상이어야 합니다.');
  });
});
```

### 통합 테스트
- 반복 일정 체크박스 선택 시 관련 필드 표시 확인
- 각 반복 유형 선택 가능 확인
- 유효하지 않은 값 입력 시 에러 메시지 표시 확인

## 🔗 관련 기능
- [반복 일정 생성 로직](./05-repeat-event-generation.md)
- [반복 일정 표시](./02-repeat-event-display.md)
- [반복 일정 수정](./03-repeat-event-update.md)


## 🧭 개발 원칙과 TDD 사이클 지침

### 변경 최소화 원칙
- **기존 코드 최대한 유지**: 기존 함수 시그니처, 파일 경로, 공용 타입은 가급적 변경하지 않습니다.
- **관심사 분리 준수**: 새 요구사항은 가능하면 새 파일로 추가합니다.
  - 유틸: `src/utils/`
  - 훅: `src/hooks/`
  - 테스트: `src/__tests__/`
- **허용되는 변경의 예**
  - 기존 훅의 반환 객체에 setter 등 필드 "추가" (삭제/이름변경 금지)
  - UI 활성화를 위한 주석 해제 및 접근성 속성 추가
  - 타입의 선택 필드 "추가" (기존 필드 변경/삭제 금지)

### TDD 사이클
1) Red: 실패 테스트 먼저 작성
- 새로운 요구사항을 드러내는 테스트를 선행합니다.
- 이 단계에서는 구현을 최소한으로 유지하며, 테스트가 실패하는지 확인합니다.

2) Green: 최소 구현으로 통과
- 기존 코드를 광범위하게 리팩터링하지 말고, "추가" 방식으로 통과시킵니다.
- 새 유틸/훅/타입을 추가하고, 필요한 지점에만 최소 연결을 합니다.

3) Refactor: 중복 제거와 정리
- 테스트가 모두 초록이 된 후, 코드 품질을 개선합니다.
- 이 단계에서 린트 예외를 제거하고, 주석/네이밍/성능을 손봅니다.

### 실패 테스트 단계의 린트 예외
- Red 단계(실패 테스트 작성)에서는 일시적으로 **ESLint 경고를 무시**할 수 있습니다.
- 테스트 파일 범위에서 필요한 규칙만 제한적으로 비활성화하세요. Green 단계에서 반드시 제거합니다.

```ts
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// Red 단계: 실패를 확인하기 위한 임시 린트 예외. Green/Refactor 단계에서 제거 필수.
```

### 실행 체크리스트
- Red: 테스트 추가 → 실패 확인
- Green: 최소 구현 → 테스트 통과 확인
- Refactor: 린트 재활성화 → `pnpm lint` / `pnpm test` / `pnpm build` 모두 통과

### 로컬 확인 명령어
- 애플리케이션 실행: `pnpm start`
- 접속 URL: `http://localhost:5173`
