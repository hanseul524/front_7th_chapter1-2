import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import App from '../App';
import { server } from '../setupTests';

const theme = createTheme();

describe('반복 일정 삭제 플로우(UI)', () => {
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

  it('삭제 클릭 시 단일/전체 선택 다이얼로그가 떠야 한다(현재 미구현으로 실패 예상)', async () => {
    const { user } = setupWithRepeatingEvent();

    const deleteBtn = await screen.findByRole('button', { name: 'Delete event' });
    await user.click(deleteBtn);

    // 다이얼로그가 보여야 함
    const dialog = await screen.findByText('해당 일정만 삭제하시겠어요?');
    expect(dialog).toBeInTheDocument();
  });
});
