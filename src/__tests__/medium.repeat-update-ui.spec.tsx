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

    // 다이얼로그가 보여야 함 (현재는 미구현 → 테스트 실패)
    await screen.findByText('해당 일정만 수정하시겠어요?');
  });
});


