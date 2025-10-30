import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import App from '../App';
import { server } from '../setupTests';

const theme = createTheme();

const setup = () => {
  const user = userEvent.setup();
  render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
  return { user };
};

describe('반복 UI 노출 및 속성', () => {
  it('반복 일정 체크 시 반복 유형/간격/종료일 필드가 보인다', async () => {
    const { user } = setup();

    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    if (!repeatCheckbox.checked) {
      await user.click(repeatCheckbox);
    }

    // 간격/종료일 입력 존재 및 속성 확인 (id로 직접 확인)
    await waitFor(() => {
      expect(document.getElementById('repeat-interval')).not.toBeNull();
      expect(document.getElementById('repeat-end-date')).not.toBeNull();
    });
    const endDateInput = document.getElementById('repeat-end-date') as HTMLInputElement;
    expect(endDateInput?.getAttribute('max')).toBe('2025-12-31');
  });
});

describe('반복 아이콘 표시', () => {
  const theme = createTheme();

  const setupWithRepeatData = () => {
    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({
          events: [
            {
              id: 'r-1',
              title: '주간 회의(반복)',
              date: '2025-10-15',
              startTime: '10:00',
              endTime: '11:00',
              description: '',
              location: '',
              category: '업무',
              repeat: { type: 'weekly', interval: 1 },
              notificationTime: 10,
            },
          ],
        });
      })
    );

    render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    );
  };

  it('월 뷰에서 반복 아이콘이 노출되어야 한다', async () => {
    setupWithRepeatData();
    const monthView = await screen.findByTestId('month-view');
    await waitFor(() => {
      expect(within(monthView).getAllByLabelText('반복 일정').length).toBeGreaterThan(0);
    });
  });

  it('우측 리스트에서도 반복 아이콘이 노출되어야 한다', async () => {
    setupWithRepeatData();
    const list = await screen.findByTestId('event-list');
    await waitFor(() => {
      expect(within(list).getAllByLabelText('반복 일정').length).toBeGreaterThan(0);
    });
  });
});
