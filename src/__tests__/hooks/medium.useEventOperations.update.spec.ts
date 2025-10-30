import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

/**
 * 반복 일정 수정(편집 모드) 분기 테스트
 * - 단일 수정: PUT /api/events/:id, 본문 repeat.type='none'
 * - 전체 수정: PUT /api/recurring-events/:repeatId
 */
describe('useEventOperations - 반복 일정 수정 분기', () => {
  it('단일 수정 선택 시 /api/events/:id 로 PUT, repeat.type="none" 본문으로 보낸다', async () => {
    // Arrange
    let putSingleCount = 0;
    let lastSingleBody: Event | null = null;
    let putAllCount = 0;

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events: [] })),
      http.put('/api/events/:id', async ({ request }) => {
        putSingleCount += 1;
        lastSingleBody = (await request.json()) as Event;
        return HttpResponse.json(lastSingleBody);
      }),
      http.put('/api/recurring-events/:repeatId', () => {
        putAllCount += 1;
        return HttpResponse.json({ ok: true });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    const editingEvent: Event = {
      id: 'e-1',
      title: '반복 회의',
      date: '2025-10-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: 'grp-1' },
      notificationTime: 10,
    };

    // Act
    await act(async () => {
      // scope: 'single' 전달 시 단일 수정 분기
      // 현재 구현에는 options 미지원 → Red
      // @ts-expect-error - 테스트 주도 설계: 두 번째 인자(options)를 추가할 계획
      await result.current.saveEvent(editingEvent, { scope: 'single' });
    });

    // Assert
    expect(putSingleCount).toBeGreaterThan(0);
    expect(putAllCount).toBe(0);
    expect(lastSingleBody?.repeat.type).toBe('none');
  });

  it('전체 수정 선택 시 /api/recurring-events/:repeatId 로 PUT 요청한다', async () => {
    // Arrange
    let putAllCount = 0;
    let putSingleCount = 0;

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events: [] })),
      http.put('/api/recurring-events/:repeatId', () => {
        putAllCount += 1;
        return HttpResponse.json({ ok: true });
      }),
      http.put('/api/events/:id', () => {
        putSingleCount += 1;
        return HttpResponse.json({ ok: true });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    const editingEvent: Event = {
      id: 'e-2',
      title: '반복 회의',
      date: '2025-10-16',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: 'grp-9' },
      notificationTime: 10,
    };

    // Act
    await act(async () => {
      // scope: 'all' 전달 시 전체 수정 분기
      // @ts-expect-error - 테스트 주도 설계: 두 번째 인자(options)를 추가할 계획
      await result.current.saveEvent(editingEvent, { scope: 'all' });
    });

    // Assert
    expect(putAllCount).toBeGreaterThan(0);
    expect(putSingleCount).toBe(0);
  });
});


