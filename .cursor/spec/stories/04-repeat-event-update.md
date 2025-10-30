---
title: 반복 일정 수정 스토리
category: calendar
type: story
updated: 2025-10-30
---

## 목적
반복 일정을 수정할 때 사용자에게 단일 수정과 전체 수정을 선택하게 하고, 선택에 따라 적절히 저장한다.

## 사용자 시나리오
1. 사용자가 반복 일정(반복 아이콘 표시)을 편집한다.
2. 저장 시 확인 다이얼로그가 뜬다: “해당 일정만 수정하시겠어요?”
3. 사용자가 선택한다:
   - 예(단일): 해당 인스턴스만 수정되고 반복에서 분리된다(`repeat.type = 'none'`).
   - 아니오(전체): 동일 반복 그룹의 모든 인스턴스가 수정된다(`repeat.id`로 식별).

## 동작 규칙
- 단일 수정 시
  - 현재 편집 중 이벤트만 `PUT /api/events/:id`
  - 본문에서 `repeat.type = 'none'`로 지정하여 반복에서 분리
  - UI에서 해당 이벤트의 반복 아이콘 제거
- 전체 수정 시
  - `PUT /api/recurring-events/:repeatId`로 일괄 수정
  - UI에서 반복 아이콘 유지

## 데이터/타입
- `RepeatInfo`: `{ type: 'none'|'daily'|'weekly'|'monthly'|'yearly', interval: number, endDate?: string, id?: string }`
- 반복 그룹 식별: `repeat.id`(repeatGroupId)

## API
- 단일 수정: `PUT /api/events/:id` (본문: `Event`)
- 전체 수정: `PUT /api/recurring-events/:repeatId` (본문: `EventForm` 또는 변경 필드)
- 테스트에서는 `msw`로 해당 엔드포인트를 `server.use`로 오버라이드해 검증

## UI
- 저장 버튼 클릭 시 확인 다이얼로그 노출
- 예/아니오 버튼에 `aria-label` 제공: `aria-label="단일 수정"`, `aria-label="전체 수정"`
- 결과에 따라 반복 아이콘 표시 여부 변경(단일: 제거, 전체: 유지)

## 접근성
- 다이얼로그에 역할/라벨 제공
- 버튼에 명확한 `aria-label`

## 테스트 케이스 (TDD)
1) 훅 테스트(실패 → 구현)
   - 편집 모드에서 단일 선택 시 `PUT /api/events/:id` 호출, 본문에 `repeat.type='none'`
   - 편집 모드에서 전체 선택 시 `PUT /api/recurring-events/:repeatId` 호출
2) UI 테스트(실패 → 구현)
   - 저장 시 다이얼로그 노출 및 두 버튼 존재
   - 단일 선택 시 리스트의 해당 항목에서 반복 아이콘 제거
   - 전체 선택 시 반복 아이콘 유지

## Out of Scope
- 반복 생성/삭제는 별도 스토리에서 다룸(01/05)

