import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import App from '../App';

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
