import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import App from '../App';
import { server } from '../setupTests';

const theme = createTheme();

describe('반복 일정 수정 플로우(UI)', () => {
  const setupWithRepeatingEvent = () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 'r-1',
              title: '반복 회의',
              date: '2025-10-15',
              startTime: '10:00',
              endTime: '11:00',
              description: '',
              location: '',
              category: '업무',
              repeat: { type: 'weekly', interval: 1, id: 'grp-1' },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    );
    return { user };
  };

  it('저장 시 단일/전체 선택 다이얼로그가 떠야 한다(현재 미구현으로 실패 예상)', async () => {
    const { user } = setupWithRepeatingEvent();

    // 리스트 로드 대기 후 편집 모드 진입
    const editBtn = await screen.findByRole('button', { name: 'Edit event' });
    await user.click(editBtn);

    // 저장(편집) 시도
    const saveBtn = await screen.findByTestId('event-submit-button');
    await user.click(saveBtn);

    // 다이얼로그가 보여야 함
    const dialogText = await screen.findByText('해당 일정만 수정하시겠어요?');
    expect(dialogText).toBeInTheDocument();
  });

  it('단일 수정 선택 시 /api/events/:id 호출 및 아이콘 제거되어야 한다', async () => {
    // Arrange - mutable store to reflect update
    let events = [
      {
        id: 'r-1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: 'grp-1' },
        notificationTime: 10,
      },
    ];
    let putSingle = 0;
    let putAll = 0;

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events })),
      http.put('/api/events/:id', async ({ request }) => {
        putSingle += 1;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = (await request.json()) as any;
        // reflect single edit separation
        events = [
          {
            ...events[0],
            ...body,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            repeat: { ...(events[0] as any).repeat, type: 'none' },
          },
        ];
        return HttpResponse.json(events[0]);
      }),
      http.put('/api/recurring-events/:repeatId', () => {
        putAll += 1;
        return HttpResponse.json({ ok: true });
      })
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    );

    const editBtn = await screen.findByRole('button', { name: 'Edit event' });
    await user.click(editBtn);
    const saveBtn = await screen.findByTestId('event-submit-button');
    await user.click(saveBtn);
    const singleBtn = await screen.findByRole('button', { name: '단일 수정' });
    await user.click(singleBtn);

    // Assert network branching
    await waitFor(() => {
      expect(putSingle).toBeGreaterThan(0);
      expect(putAll).toBe(0);
    });

    // Assert icon removal in list
    const list = await screen.findByTestId('event-list');
    await waitFor(() => {
      expect(list.querySelector('[aria-label="반복 일정"]')).toBeNull();
    });
  });

  it('전체 수정 선택 시 /api/recurring-events/:repeatId 호출 및 아이콘 유지', async () => {
    // Arrange
    const events = [
      {
        id: 'r-1',
        title: '반복 회의',
        date: '2025-10-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, id: 'grp-1' },
        notificationTime: 10,
      },
    ];
    let putSingle = 0;
    let putAll = 0;

    server.use(
      http.get('/api/events', () => HttpResponse.json({ events })),
      http.put('/api/recurring-events/:repeatId', () => {
        putAll += 1;
        return HttpResponse.json({ ok: true });
      }),
      http.put('/api/events/:id', () => {
        putSingle += 1;
        return HttpResponse.json(events[0]);
      })
    );

    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    );

    const editBtn = await screen.findByRole('button', { name: 'Edit event' });
    await user.click(editBtn);
    const saveBtn = await screen.findByTestId('event-submit-button');
    await user.click(saveBtn);
    const allBtn = await screen.findByRole('button', { name: '전체 수정' });
    await user.click(allBtn);

    await waitFor(() => {
      expect(putAll).toBeGreaterThan(0);
      expect(putSingle).toBe(0);
    });

    // 아이콘 유지 확인
    const list = await screen.findByTestId('event-list');
    await waitFor(() => {
      expect(list.querySelector('[aria-label="반복 일정"]')).not.toBeNull();
    });
  });
});
