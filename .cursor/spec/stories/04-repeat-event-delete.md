# 반복 일정 삭제 기능 설계

## 📋 개요
반복 일정을 삭제할 때 "해당 일정만 삭제" 또는 "전체 삭제"를 선택할 수 있는 기능을 설계합니다.

## 🎯 목적
- 사용자가 반복 일정의 한 인스턴스를 삭제할 때 선택권 제공
- 단일 삭제: 해당 일정만 삭제
- 전체 삭제: 모든 반복 일정 삭제

## 📥 입력 (Input)

### 사용자 입력
```typescript
interface DeleteRepeatEventInput {
  eventId: string;              // 삭제할 이벤트 ID
  deleteType: 'single' | 'all'; // 삭제 범위
  repeatId?: string;            // 반복 시리즈 ID (전체 삭제 시 필요, repeat.id)
}
```

### 삭제 시나리오
1. **단일 삭제 ('예' 선택)**
   - 해당 일정만 삭제
   - 다른 반복 일정은 유지

2. **전체 삭제 ('아니오' 선택)**
   - 같은 반복 시리즈의 모든 일정 삭제
   - 동일한 `repeat.id`를 가진 모든 이벤트 제거

## ⚙️ 처리 로직 (Process)

### 1. 확인 다이얼로그 추가 (App.tsx)

```typescript
// 상태 추가
const [isRepeatDeleteDialogOpen, setIsRepeatDeleteDialogOpen] = useState(false);
const [pendingDelete, setPendingDelete] = useState<Event | null>(null);

// 삭제 버튼 클릭 핸들러 수정
const handleDeleteClick = (event: Event) => {
  // 반복 일정인지 확인
  if (event.repeat.type !== 'none') {
    setPendingDelete(event);
    setIsRepeatDeleteDialogOpen(true);
  } else {
    // 일반 일정은 바로 삭제
    deleteEvent(event.id);
  }
};

// 기존 삭제 버튼 onClick 수정
<IconButton 
  aria-label="Delete event" 
  onClick={() => handleDeleteClick(event)}  // 수정
>
  <Delete />
</IconButton>

// 반복 일정 삭제 확인 다이얼로그
<Dialog 
  open={isRepeatDeleteDialogOpen} 
  onClose={() => setIsRepeatDeleteDialogOpen(false)}
>
  <DialogTitle>반복 일정 삭제</DialogTitle>
  <DialogContent>
    <DialogContentText>
      해당 일정만 삭제하시겠어요?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button 
      onClick={() => setIsRepeatDeleteDialogOpen(false)}
      aria-label="취소"
    >
      취소
    </Button>
    <Button 
      onClick={() => handleRepeatDelete('all')}
      color="error"
      aria-label="전체 삭제"
    >
      아니오 (전체 삭제)
    </Button>
    <Button 
      onClick={() => handleRepeatDelete('single')}
      color="warning"
      aria-label="단일 삭제"
    >
      예 (해당 일정만)
    </Button>
  </DialogActions>
</Dialog>
```

### 2. 삭제 처리 함수 (App.tsx)

```typescript
/**
 * 반복 일정 삭제 처리
 */
const handleRepeatDelete = async (deleteType: 'single' | 'all') => {
  if (!pendingDelete) return;
  
  if (deleteType === 'single') {
    // 단일 삭제: 해당 일정만 제거
    await deleteEvent(pendingDelete.id);
  } else {
    // 전체 삭제: 반복 시리즈 전체 제거
    await deleteRepeatSeries(pendingDelete.repeat.id);
  }
  
  setIsRepeatDeleteDialogOpen(false);
  setPendingDelete(null);
};
```

### 3. 반복 시리즈 전체 삭제 (useEventOperations.ts)

```typescript
/**
 * 반복 시리즈의 모든 일정 삭제
 */
const deleteRepeatSeries = async (repeatId: string) => {
  try {
    const response = await fetch(`/api/recurring-events/${repeatId}`, { method: 'DELETE' });
    
    if (!response.ok) {
      throw new Error('Failed to delete repeat group');
    }
    
    await fetchEvents();
    enqueueSnackbar('반복 일정이 모두 삭제되었습니다.', { variant: 'info' });
  } catch (error) {
    console.error('Error deleting repeat series:', error);
    enqueueSnackbar('반복 일정 삭제 실패', { variant: 'error' });
  }
};

// 반환 객체에 추가
return { 
  events, 
  fetchEvents, 
  saveEvent, 
  deleteEvent,
  deleteRepeatSeries  // 새로 추가
};
```

### 4. 서버 API 엔드포인트 (변경 없음)

기존 서버의 반복 시리즈 엔드포인트를 사용합니다.

```http
DELETE /api/recurring-events/:repeatId   // 시리즈 전체 삭제
```

### 5. Hook 확장 (useEventOperations.ts)

```typescript
export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  // ... 기존 함수들

  /**
   * 반복 그룹 전체 삭제
   */
  const deleteRepeatSeries = async (repeatId?: string) => {
    if (!repeatId) {
      enqueueSnackbar('반복 그룹 ID가 없습니다.', { variant: 'error' });
      return;
    }

    try {
      const response = await fetch(`/api/recurring-events/${repeatId}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete repeat group');
      }

      await fetchEvents();
      enqueueSnackbar('반복 일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting repeat series:', error);
      enqueueSnackbar('반복 일정 삭제 실패', { variant: 'error' });
    }
  };

  return { 
    events, 
    fetchEvents, 
    saveEvent, 
    deleteEvent,
    deleteRepeatSeries 
  };
};
```

## 📤 출력 (Output)

### 단일 삭제 결과
```typescript
// Before: 3개의 반복 일정
[
  { id: "1", date: "2025-01-06", repeat: { type: "weekly", interval: 1, id: "series-1" } },
  { id: "2", date: "2025-01-13", repeat: { type: "weekly", interval: 1, id: "series-1" } },
  { id: "3", date: "2025-01-20", repeat: { type: "weekly", interval: 1, id: "series-1" } },
]

// After: id="2"만 삭제
[
  { id: "1", date: "2025-01-06", repeat: { type: "weekly", interval: 1, id: "series-1" } },  // 유지
  // id="2" 삭제됨
  { id: "3", date: "2025-01-20", repeat: { type: "weekly", interval: 1, id: "series-1" } },  // 유지
]
```

### 전체 삭제 결과
```typescript
// Before: 여러 반복 일정과 일반 일정
[
  { id: "1", date: "2025-01-06", repeat: { type: "weekly", interval: 1, id: "series-1" } },
  { id: "2", date: "2025-01-13", repeat: { type: "weekly", interval: 1, id: "series-1" } },
  { id: "3", date: "2025-01-20", repeat: { type: "weekly", interval: 1, id: "series-1" } },
  { id: "4", date: "2025-01-15", repeat: { type: "none", interval: 1 } },  // 일반 일정
]

// After: repeat.id="series-1" 모두 삭제
[
  { id: "4", date: "2025-01-15", repeat: { type: "none" } },  // 유지
]
```

### API 응답
```typescript
// 단일 삭제
{
  "message": "Event deleted"
}

// 전체 삭제
{
  "message": "Repeat group deleted",
  "deletedCount": 10
}
```

### 사용자 피드백
```typescript
// 단일 삭제
"일정이 삭제되었습니다." (info)

// 전체 삭제
"반복 일정 10개가 삭제되었습니다." (info)

// 오류
"반복 일정 삭제 실패" (error)
```

## 📁 영향받는 파일

### 수정 필요
1. 🔧 `src/App.tsx` - 확인 다이얼로그 및 삭제 로직 추가
2. 🔧 `src/hooks/useEventOperations.ts` - `deleteRepeatSeries` 함수 추가
3. 🔧 서버 엔드포인트 변경 없음(기존 `/api/recurring-events/:repeatId` 사용)

### 테스트 파일 추가
4. 🔧 `src/__tests__/hooks/medium.useEventOperations.spec.ts` - 테스트 추가
5. ✨ `src/__tests__/integration/repeat-delete.spec.tsx` - 통합 테스트

## 🚨 고려사항

### 안전성

#### 실수 방지
```typescript
// 다이얼로그 문구를 명확하게
// "예" = 해당 일정만, "아니오" = 전체
// 위험한 작업(전체 삭제)은 빨간색으로 강조

<Button color="error">아니오 (전체 삭제)</Button>
<Button color="warning">예 (해당 일정만)</Button>
```

#### 되돌리기 불가능 경고
```typescript
// 전체 삭제 시 추가 경고 (선택사항)
<DialogContentText>
  해당 일정만 삭제하시겠어요?
  <Typography color="error" sx={{ mt: 1 }}>
    ※ 전체 삭제 시 모든 반복 일정이 영구적으로 삭제되며 복구할 수 없습니다.
  </Typography>
</DialogContentText>
```

### UI/UX 고려사항

#### 다이얼로그 디자인
```
┌────────────────────────────────┐
│ 반복 일정 삭제              [X]│
├────────────────────────────────┤
│ 해당 일정만 삭제하시겠어요?    │
│                                │
│ ※ 전체 삭제 시 N개의 반복     │
│    일정이 모두 삭제됩니다.     │
├────────────────────────────────┤
│  [취소] [아니오-전체] [예-단일]│
└────────────────────────────────┘
```

#### 삭제된 개수 표시
```typescript
// 전체 삭제 후 피드백에 삭제된 개수 포함
enqueueSnackbar(
  `반복 일정 ${deletedCount}개가 삭제되었습니다.`,
  { variant: 'info' }
);
```

#### 로딩 상태
```typescript
// 대량 삭제 시 로딩 표시
const [isDeleting, setIsDeleting] = useState(false);

const deleteRepeatSeries = async (repeatId) => {
  setIsDeleting(true);
  try {
    // ... 삭제 로직
  } finally {
    setIsDeleting(false);
  }
};
```

### 성능 고려사항

#### 대량 삭제 최적화
```javascript
// 서버에서 배치 삭제
app.delete('/api/recurring-events/:repeatId', (req, res) => {
  const { repeatId } = req.params;
  
  // filter를 한 번만 실행
  const newEvents = events.filter(e => e.repeat?.id !== repeatId);
  const deletedCount = events.length - newEvents.length;
  events = newEvents;
  
  res.json({ deletedCount });
});
```

#### 클라이언트 캐시 업데이트
```typescript
// 삭제 후 전체 목록 재조회 vs. 로컬 상태 업데이트
// 현재: fetchEvents() 호출 (안전하지만 느림)
// 최적화: 로컬 상태에서 직접 제거 (빠르지만 동기화 주의)

// 최적화 예시
const deleteRepeatSeries = async (repeatId) => {
  // 서버 요청
  await fetch(`/api/recurring-events/${repeatId}`, { method: 'DELETE' });
  
  // 로컬 상태 업데이트 (재조회 없이)
  setEvents(prev => prev.filter(e => e.repeat?.id !== repeatId));
};
```

### 예외 상황 처리

#### 1. repeat.id가 없는 경우
```typescript
if (!pendingDelete.repeat?.id) {
  enqueueSnackbar('반복 그룹 정보가 없습니다.', { variant: 'error' });
  return;
}
```

#### 2. 이미 삭제된 일정
```typescript
// 서버에서 404 처리
if (groupEvents.length === 0) {
  return res.status(404).json({ error: 'Repeat group not found' });
}

// 클라이언트에서 처리
if (!response.ok) {
  if (response.status === 404) {
    enqueueSnackbar('이미 삭제된 일정입니다.', { variant: 'warning' });
  }
}
```

#### 3. 네트워크 오류
```typescript
try {
  await deleteRepeatSeries(repeatId);
} catch (error) {
  enqueueSnackbar(
    '네트워크 오류로 삭제에 실패했습니다. 다시 시도해주세요.',
    { variant: 'error' }
  );
}
```

### 알림 삭제 처리

```typescript
// 반복 일정 삭제 시 관련 알림도 제거
// useNotifications 훅에서 처리 필요
useEffect(() => {
  // 존재하지 않는 이벤트의 알림 제거
  setNotifications(prev => 
    prev.filter(notif => 
      events.some(event => event.id === notif.id)
    )
  );
}, [events]);
```

## ✅ 검증 방법

### 단위 테스트
```typescript
describe('반복 일정 삭제', () => {
  test('단일 삭제 시 해당 일정만 제거', async () => {
    const events = [
      { id: '1', repeat: { id: 'series-1' } },
      { id: '2', repeat: { id: 'series-1' } },
      { id: '3', repeat: { id: 'series-1' } },
    ];
    
    await deleteEvent('2');
    
    const remaining = getEvents();
    expect(remaining).toHaveLength(2);
    expect(remaining.find(e => e.id === '2')).toBeUndefined();
  });
  
  test('전체 삭제 시 그룹의 모든 일정 제거', async () => {
    const events = [
      { id: '1', repeat: { id: 'series-1' } },
      { id: '2', repeat: { id: 'series-1' } },
      { id: '3', repeat: { id: 'series-2' } },
    ];
    
    const result = await deleteRepeatSeries('series-1');
    
    expect(result.deletedCount).toBe(2);
    const remaining = getEvents();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('3');
  });
});
```

### 통합 테스트
```typescript
test('반복 일정 삭제 플로우', async () => {
  // 1. 반복 일정 생성
  // 2. 삭제 버튼 클릭
  // 3. 확인 다이얼로그 표시
  // 4. "예" 클릭 → 단일 삭제
  // 5. 해당 일정만 삭제 확인
  
  // 6. 다른 반복 일정 삭제 버튼 클릭
  // 7. "아니오" 클릭 → 전체 삭제
  // 8. 모든 반복 일정 삭제 확인
  // 9. 피드백 메시지 확인
});
```

### 수동 테스트 체크리스트
- [ ] 일반 일정 삭제 시 다이얼로그 표시 안 함
- [ ] 반복 일정 삭제 시 다이얼로그 표시
- [ ] "예" 선택 시 해당 일정만 삭제
- [ ] "아니오" 선택 시 전체 삭제
- [ ] "취소" 선택 시 삭제 안 함
- [ ] 삭제 후 적절한 피드백 메시지 표시
- [ ] 전체 삭제 시 삭제된 개수 표시
- [ ] 캘린더와 목록에서 삭제된 일정 사라짐 확인

## 🔗 관련 기능
- [반복 일정 생성](./01-repeat-event-creation.md)
- [반복 일정 수정](./03-repeat-event-update.md)
- [반복 일정 생성 로직](./05-repeat-event-generation.md)

