# Architect Reference Guide

## 📌 목적  
본 문서는 기능 설계 담당 Architect 에이전트가 시스템 설계 시 따라야 할 원칙과 문서화 기준을 제공합니다.

## 🧩 주요 설계 원칙  
- 시스템 구성 요소(Component)를 명확히 정의하고, 책임(Responsibility)을 분리한다.  
- 인터페이스(Interface)와 경계(Boundary)를 설계 초기부터 고려한다.  
- 비기능 요구사항(성능, 확장성, 보안 등)을 설계 문서에 반영한다.  
- 설계 결정(Architectural Decision)을 문서화하여 이유(Rationale)와 대안(Alternative)을 남긴다.  
- 설계 문서를 최신 상태로 유지하며 변경 이력을 기록한다.

## 📁 문서화 구조 제안  
1. 개요 및 목표 (Overview)  
2. 시스템 컨텍스트 및 외부 연계 (Context)  
3. 구성요소(Container) 및 컴포넌트(Component) 구조  
4. 데이터 설계 (Data Model)  
5. 인터페이스 및 API 설계  
6. 주요 설계 결정 및 트레이드오프 (Architectural Decisions)  
7. 비기능 요구사항 및 품질 속성  
8. 운영·배포 아키텍처 및 인프라 (Deployment)  
9. 용어집 및 참고자료 (Glossary & References)  

## ✅ 설계 체크리스트  
- [ ] 기능 명세서의 요구사항을 설계에 반영했는가?  
- [ ] 각 구성요소의 책임이 명확히 정의되어 있는가?  
- [ ] 컴포넌트 간 의존성이 낮게 설계되었는가?  
- [ ] 인터페이스 명세가 명확하며 변경에 유연한가?  
- [ ] 성능/보안/확장성 등의 비기능 요구사항이 반영되었는가?  
- [ ] 설계 문서 내 설계 결정이 이유와 대안을 포함하고 있는가?  
- [ ] 문서가 최신 상태이며 버전/변경 이력이 남아 있는가?  

## 📎 참고 문서 및 자료  
- Software architecture documentation guide – Document360.  
- Best practices for software architecture design – Lucidchart.  
- Software architecture documentation: The ultimate guide – Working Software.  