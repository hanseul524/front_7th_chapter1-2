# 반복 일정 수정 기능 설계

## 📋 개요
반복 일정을 수정할 때 "해당 일정만 수정" 또는 "전체 수정"을 선택할 수 있는 기능을 설계합니다.

## 🎯 목적
- 사용자가 반복 일정의 한 인스턴스를 수정할 때 선택권 제공
- 단일 수정: 해당 일정만 변경, 반복 일정에서 분리
- 전체 수정: 모든 반복 일정에 변경사항 적용

## 📥 입력 (Input)

### 사용자 입력
```typescript
interface UpdateRepeatEventInput {
  eventId: string;              // 수정할 이벤트 ID
  updateType: 'single' | 'all'; // 수정 범위
  updatedData: Partial<EventForm>; // 변경할 데이터
}
```

### 수정 시나리오
1. **단일 수정 ('예' 선택)**
   - 해당 일정만 수정
   - 반복 일정에서 분리 (repeat.type을 'none'으로 변경)
   - 반복 아이콘 사라짐
   - 원본 반복 일정은 유지

2. **전체 수정 ('아니오' 선택)**
   - 모든 반복 일정에 변경사항 적용
   - 반복 설정 유지
   - 반복 아이콘 유지

## ⚙️ 처리 로직 (Process)

### 1. 타입 정의 확장 (types.ts)

```typescript
// 반복 시리즈 식별자는 서버에서 repeat.id로 부여됨
export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
  id?: string; // 선택 필드, 시리즈 전체 수정/삭제에 사용
}

export type RepeatUpdateType = 'single' | 'all';
```

### 2. 확인 다이얼로그 추가 (App.tsx)

```typescript
// 상태 추가
const [isRepeatUpdateDialogOpen, setIsRepeatUpdateDialogOpen] = useState(false);
const [pendingUpdate, setPendingUpdate] = useState<{
  event: Event;
  updateData: Partial<EventForm>;
} | null>(null);

// 수정 버튼 클릭 핸들러
const handleEditClick = (event: Event) => {
  // 반복 일정인지 확인
  if (event.repeat.type !== 'none') {
    // 폼에 데이터 채우기
    editEvent(event);
    
    // 확인 다이얼로그 표시 (수정 완료 버튼 클릭 시)
    // 이 로직은 addOrUpdateEvent 함수 내부로 이동
  } else {
    // 일반 일정은 바로 수정 모드
    editEvent(event);
  }
};

// 일정 저장 로직 수정
const addOrUpdateEvent = async () => {
  // ... 유효성 검증
  
  const eventData: Event | EventForm = {
    // ... 데이터 구성
  };
  
  // 반복 일정 수정인 경우
  if (editingEvent && editingEvent.repeat.type !== 'none') {
    setPendingUpdate({ event: editingEvent, updateData: eventData });
    setIsRepeatUpdateDialogOpen(true);
    return;
  }
  
  // 일반 저장 로직
  const overlapping = findOverlappingEvents(eventData, events);
  if (overlapping.length > 0) {
    setOverlappingEvents(overlapping);
    setIsOverlapDialogOpen(true);
  } else {
    await saveEvent(eventData);
    resetForm();
  }
};

// 반복 일정 수정 확인 다이얼로그
<Dialog 
  open={isRepeatUpdateDialogOpen} 
  onClose={() => setIsRepeatUpdateDialogOpen(false)}
>
  <DialogTitle>반복 일정 수정</DialogTitle>
  <DialogContent>
    <DialogContentText>
      해당 일정만 수정하시겠어요?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => handleRepeatUpdate('all')}
      aria-label="전체 수정"
    >
      아니오 (전체 수정)
    </Button>
    <Button 
      onClick={() => handleRepeatUpdate('single')}
      color="primary"
      aria-label="단일 수정"
    >
      예 (해당 일정만)
    </Button>
  </DialogActions>
</Dialog>
```

### 3. 수정 처리 함수

```typescript
const handleRepeatUpdate = async (updateType: RepeatUpdateType) => {
  if (!pendingUpdate) return;
  
  const { event, updateData } = pendingUpdate;
  
  if (updateType === 'single') {
    // 단일 수정: 반복 정보 제거
    const updatedEvent = {
      ...updateData,
      id: event.id,
      repeat: {
        type: 'none' as RepeatType,
        interval: 1,
      },
      // 시리즈에서 분리: repeat.id는 서버 저장 후 제거됨(선택)
    };
    
    await saveEvent(updatedEvent);
  } else {
    // 전체 수정: 반복 정보 유지
    const updatedEvent = {
      ...updateData,
      id: event.id,
      repeat: event.repeat,  // 기존 반복 정보 유지
    };
    
    await updateRepeatSeries(event.repeat.id!, updatedEvent);
  }
  
  setIsRepeatUpdateDialogOpen(false);
  setPendingUpdate(null);
  resetForm();
};
```

### 4. 반복 시리즈 전체 수정 (useEventOperations.ts)

```typescript
/**
 * 반복 시리즈의 모든 일정 업데이트
 */
const updateRepeatSeries = async (repeatId: string, updateData: Partial<EventForm>) => {
  try {
    // 서버에 전체 수정 요청 (기존 엔드포인트 사용)
    const response = await fetch(`/api/recurring-events/${repeatId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update repeat group');
    }
    
    await fetchEvents();
    enqueueSnackbar('반복 일정이 모두 수정되었습니다.', { variant: 'success' });
  } catch (error) {
    console.error('Error updating repeat series:', error);
    enqueueSnackbar('반복 일정 수정 실패', { variant: 'error' });
  }
};

// 반환 객체에 추가
return { 
  events, 
  fetchEvents, 
  saveEvent, 
  deleteEvent,
  updateRepeatSeries  // 새로 추가
};
```

### 5. 서버 API 엔드포인트

기존 서버의 반복 시리즈 엔드포인트를 사용합니다.

```http
PUT /api/recurring-events/:repeatId   // 시리즈 전체 수정
```

## 📤 출력 (Output)

### 단일 수정 결과
```typescript
// Before (반복 일정)
{
  id: "event-1-20250106",
  title: "주간 회의",
  date: "2025-01-06",
  repeat: {
    type: "weekly",
    interval: 1,
    endDate: "2025-12-31",
    id: "series-1"
  }
}

// After (단일 일정으로 변경)
{
  id: "event-1-20250106",
  title: "임시 회의",        // 제목 변경
  date: "2025-01-06",
  repeat: {
    type: "none",            // 반복 제거
    interval: 1
  }
}

// 다른 반복 일정들은 유지
// event-1-20250113, event-1-20250120, ... 계속 존재
```

### 전체 수정 결과
```typescript
// Before
{
  id: "event-1-20250106",
  title: "주간 회의",
  startTime: "10:00",
  repeat: { type: "weekly", interval: 1, id: "series-1" }
}

// After (그룹의 모든 이벤트)
{
  id: "event-1-20250106",
  title: "팀 스탠드업",      // 제목 변경
  startTime: "09:00",        // 시간 변경
  repeat: { type: "weekly", interval: 1, id: "series-1" }  // 반복 유지
}
// event-1-20250113, event-1-20250120도 모두 동일하게 변경
```

## 📁 영향받는 파일

### 수정 필요
1. 🔧 `src/types.ts` - `RepeatInfo.id?` 필드 추가(완료)
2. 🔧 `src/App.tsx` - 확인 다이얼로그 및 수정 로직 추가
3. 🔧 `src/hooks/useEventOperations.ts` - `updateRepeatSeries` 함수 추가
4. 🔧 서버 엔드포인트 변경 없음(기존 `/api/recurring-events/:repeatId` 사용)

### 테스트 파일 추가
5. 🔧 `src/__tests__/hooks/medium.useEventOperations.spec.ts` - 테스트 추가
6. ✨ `src/__tests__/integration/repeat-update.spec.tsx` - 통합 테스트

## 🚨 고려사항

### 데이터 무결성

#### 반복 시리즈 식별자 관리
```typescript
// 반복 일정 저장 시 서버가 공통 시리즈 식별자를 repeat.id로 부여
// 클라이언트는 repeat.id를 사용해 전체 수정/삭제 요청을 수행
```

#### 단일 수정 후 원본 추적
```typescript
// originalDate를 사용하여 원본 반복 일정 추적 가능
// 필요 시 "원래 반복 일정으로 되돌리기" 기능 구현 가능
```

### UI/UX 고려사항

#### 다이얼로그 문구
```
제목: "반복 일정 수정"
내용: "해당 일정만 수정하시겠어요?"
버튼:
  - "예 (해당 일정만)" → 단일 수정
  - "아니오 (전체 수정)" → 전체 수정
  - "취소" (X 버튼)
```

#### 수정 후 피드백
- 단일 수정: "일정이 수정되었습니다."
- 전체 수정: "반복 일정 N개가 모두 수정되었습니다."

#### 수정 제한사항
```typescript
// 전체 수정 시 반복 설정 자체는 수정 가능
// 하지만 반복 유형 변경은 주의 필요 (예: 매주 → 매월)

// 안전한 방법: 전체 수정 시 반복 설정은 변경 불가
// 변경하려면 삭제 후 재생성 권장
```

### 성능 고려사항

#### 전체 수정 시 트랜잭션
```text
// 서버는 /api/recurring-events/:repeatId 엔드포인트에서 일괄 업데이트를 처리
// 일부 실패 시 적절한 에러 응답을 반환(서버 구현 범위)
```

#### 대량 업데이트 최적화
```typescript
// 반복 일정이 많을 경우 (100개 이상)
// 서버 측에서 배치 업데이트 최적화 필요
// 클라이언트는 로딩 상태 표시
```

### 예외 상황 처리

#### 1. 반복 일정의 일부가 이미 단일 수정된 경우
```typescript
// 전체 수정은 동일한 repeat.id를 가진 일정에만 적용
// 이미 단일 수정되어 repeat.type === 'none'인 일정은 영향 없음
```

#### 2. 수정 중 네트워크 오류
```typescript
// 재시도 로직 또는 사용자에게 명확한 오류 메시지
enqueueSnackbar('네트워크 오류로 수정에 실패했습니다. 다시 시도해주세요.', { 
  variant: 'error' 
});
```

## ✅ 검증 방법

### 단위 테스트
```typescript
describe('반복 일정 수정', () => {
  test('단일 수정 시 repeat.type이 none으로 변경', async () => {
    const event: Event = {
      id: '1',
      repeat: { type: 'weekly', interval: 1, id: 'series-1' },
      // ...
    };
    
    const result = await updateSingleEvent(event, { title: 'New Title' });
    expect(result.repeat.type).toBe('none');
    expect(result.repeat.type).toBe('none');
  });
  
  test('전체 수정 시 모든 시리즈 이벤트가 업데이트', async () => {
    const repeatId = 'series-1';
    const updateData = { title: 'Updated Title' };
    
    await updateRepeatSeries(repeatId, updateData);
    
    const seriesEvents = events.filter(e => e.repeat.id === repeatId);
    seriesEvents.forEach(event => {
      expect(event.title).toBe('Updated Title');
      expect(event.repeat.type).not.toBe('none');
    });
  });
});
```

### 통합 테스트
```typescript
test('반복 일정 수정 플로우', async () => {
  // 1. 반복 일정 생성
  // 2. 수정 버튼 클릭
  // 3. 확인 다이얼로그 표시 확인
  // 4. "예" 클릭 → 단일 수정
  // 5. 반복 아이콘 사라짐 확인
  
  // 6. 다른 반복 일정 수정
  // 7. "아니오" 클릭 → 전체 수정
  // 8. 모든 반복 일정 변경 확인
  // 9. 반복 아이콘 유지 확인
});
```

## 🔗 관련 기능
- [반복 일정 생성](./01-repeat-event-creation.md)
- [반복 일정 삭제](./04-repeat-event-delete.md)
- [반복 일정 생성 로직](./05-repeat-event-generation.md)

