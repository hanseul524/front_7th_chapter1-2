import { describe, it, expect } from 'vitest';

import { EventForm } from '../../types.ts';
import { generateRepeatEvents } from '../../utils/repeatGeneration.ts';

/**
 * 반복 인스턴스 생성 유틸에 대한 단위 테스트
 * - 스토리/요구사항 1번의 특수 규칙(31일, 윤년 2/29) 반영 검증
 */
describe('generateRepeatEvents', () => {
  it('매월 31일 규칙에 따라 31일이 있는 달에만 생성해야 한다', () => {
    // Arrange
    const seed: EventForm = {
      title: '월말 결산',
      date: '2025-01-31',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '업무',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    // Act
    const events = generateRepeatEvents(seed);

    // Assert
    const dates = events.map((e) => e.date);
    expect(dates).toEqual([
      '2025-01-31',
      '2025-03-31',
      '2025-05-31',
      '2025-07-31',
      '2025-08-31',
      '2025-10-31',
      '2025-12-31',
    ]);
  });

  it('윤년 2월 29일 yearly 반복은 윤년에만 생성해야 한다', () => {
    // Arrange
    const seed: EventForm = {
      title: '윤년 기념일',
      date: '2024-02-29',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '개인',
      repeat: { type: 'yearly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    // Act
    const events = generateRepeatEvents(seed);

    // Assert
    const dates = events.map((e) => e.date);
    expect(dates).toEqual(['2024-02-29']);
  });

  it('매월 30일 반복은 2월을 제외하고 30일이 존재하는 달에만 생성해야 한다', () => {
    // Arrange
    const seed: EventForm = {
      title: '월 30일 리마인드',
      date: '2025-01-30',
      startTime: '09:00',
      endTime: '10:00',
      description: '',
      location: '',
      category: '개인',
      repeat: { type: 'monthly', interval: 1, endDate: '2025-12-31' },
      notificationTime: 10,
    };

    // Act
    const events = generateRepeatEvents(seed);

    // Assert
    const dates = events.map((e) => e.date);
    expect(dates).toEqual([
      '2025-01-30',
      // 2025-02-30는 존재하지 않으므로 제외
      '2025-03-30',
      '2025-04-30',
      '2025-05-30',
      '2025-06-30',
      '2025-07-30',
      '2025-08-30',
      '2025-09-30',
      '2025-10-30',
      '2025-11-30',
      '2025-12-30',
    ]);
  });

  it('평년 2월 28일 yearly 반복은 평년에만 생성해야 한다(윤년 제외)', () => {
    // Arrange
    const seed: EventForm = {
      title: '평년 2/28 기념일',
      date: '2025-02-28', // 2025는 평년
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '',
      category: '개인',
      repeat: { type: 'yearly', interval: 1, endDate: '2028-12-31' },
      notificationTime: 10,
    };

    // Act
    const events = generateRepeatEvents(seed);

    // Assert
    const dates = events.map((e) => e.date);
    expect(dates).toEqual([
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      // 2028은 윤년이므로 제외
    ]);
  });
});
