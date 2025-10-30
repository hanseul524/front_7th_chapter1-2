import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';

describe('useEventOperations - 반복 일정 삭제 분기', () => {
  it('단일 삭제 선택 시 /api/events/:id 로 DELETE 요청한다', async () => {
    // Arrange
    let deleteSingle = 0;
    let deleteAll = 0;

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events: [] })),
      http.delete('/api/events/:id', () => {
        deleteSingle += 1;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/recurring-events/:repeatId', () => {
        deleteAll += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    // Act
    await act(async () => {
      // @ts-expect-error 테스트 주도 설계: options 두 번째 인자 도입 예정
      await result.current.deleteEvent('e-1', { scope: 'single' });
    });

    // Assert (Red 예상: 현재 구현은 옵션 미지원/단일만 호출)
    expect(deleteSingle).toBeGreaterThan(0);
    expect(deleteAll).toBe(0);
  });

  it('전체 삭제 선택 시 /api/recurring-events/:repeatId 로 DELETE 요청한다', async () => {
    // Arrange
    let deleteSingle = 0;
    let deleteAll = 0;

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events: [] })),
      http.delete('/api/recurring-events/:repeatId', () => {
        deleteAll += 1;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/events/:id', () => {
        deleteSingle += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    // Act
    await act(async () => {
      // @ts-expect-error 테스트 주도 설계: options 두 번째 인자 도입 예정
      await result.current.deleteEvent('e-1', { scope: 'all', repeatId: 'grp-1' });
    });

    // Assert (Red 예상: 현재 구현은 /api/events/:id 만 호출)
    expect(deleteAll).toBeGreaterThan(0);
    expect(deleteSingle).toBe(0);
  });
});


