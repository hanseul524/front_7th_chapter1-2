import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { generateRepeatEvents } from '../utils/repeatGeneration';

type SaveScope = 'single' | 'all';
type SaveOptions = { scope?: SaveScope };

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  /**
   * 이벤트 저장/수정 엔트리 포인트
   * - 생성 모드: 단일 또는 반복 인스턴스 일괄 생성
   * - 편집 모드: scope에 따라 단일 분리 수정 또는 반복 그룹 전체 수정
   */
  const saveEvent = async (eventData: Event | EventForm, options?: SaveOptions) => {
    try {
      let response;
      if (editing) {
        const scope = options?.scope;
        if (scope === 'single') {
          const payload: Event = {
            ...(eventData as Event),
            repeat: {
              ...(eventData as Event).repeat,
              type: 'none',
            },
          };
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } else if (scope === 'all') {
          const repeatId = (eventData as Event).repeat?.id;
          response = await fetch(`/api/recurring-events/${repeatId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        } else {
          response = await fetch(`/api/events/${(eventData as Event).id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      } else {
        const isRepeating =
          (eventData as EventForm).repeat?.type && (eventData as EventForm).repeat.type !== 'none';
        if (isRepeating) {
          const instances = generateRepeatEvents(eventData as EventForm);
          response = await fetch('/api/events-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: instances }),
          });
        } else {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      }

      if (!response.ok) {
        throw new Error('Failed to save event');
      }

      await fetchEvents();
      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  /**
   * 이벤트 삭제 엔트리 포인트
   * - scope 미지정 또는 'single': 단일 인스턴스 삭제
   * - scope 'all': 반복 그룹 전체 삭제(repeatId 필요)
   */
  const deleteEvent = async (
    id: string,
    options?: { scope?: 'single' | 'all'; repeatId?: string }
  ) => {
    try {
      let response: Response;
      if (options?.scope === 'all') {
        const repeatId = options.repeatId;
        response = await fetch(`/api/recurring-events/${repeatId}`, { method: 'DELETE' });
      } else {
        response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      }

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, fetchEvents, saveEvent, deleteEvent };
};
