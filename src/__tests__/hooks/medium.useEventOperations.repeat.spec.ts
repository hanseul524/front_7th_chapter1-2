import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { EventForm } from '../../types.ts';

/**
 * 반복 저장 시 일괄 저장 엔드포인트(`/api/events-list`)를 호출해야 한다.
 * - 현재 구현은 단건 `/api/events`를 호출하므로 본 테스트는 Red 단계에서 실패한다.
 */
describe('useEventOperations - 반복 일정 저장 플로우', () => {
  it('repeat.type !== "none" 인 경우 /api/events-list 로 POST 요청한다', async () => {
    // Arrange
    let eventsListCalled = 0;
    let singleEventCalled = 0;

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: [] });
      }),
      http.post('/api/events-list', async ({ request }) => {
        eventsListCalled += 1;
        const body = (await request.json()) as { events: EventForm[] };
        // 간단한 응답
        return HttpResponse.json(body.events, { status: 201 });
      }),
      http.post('/api/events', () => {
        singleEventCalled += 1;
        return new HttpResponse(null, { status: 500 }); // 잘못된 경로 사용 시 실패 유도
      })
    );

    const { result } = renderHook(() => useEventOperations(false));

    await act(() => Promise.resolve(null));

    const form: EventForm = {
      title: '주간 회의',
      date: '2025-01-06',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    // Act
    await act(async () => {
      await result.current.saveEvent(form);
    });

    // Assert
    expect(eventsListCalled).toBeGreaterThan(0);
    expect(singleEventCalled).toBe(0);
  });
});
