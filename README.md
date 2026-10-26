# VERDANT

**Beyond the noise. — 시장의 소음 너머, 움직임의 이유까지.**

공시에서 시작하는 국내 주식 리서치 대시보드입니다. 딥 포레스트·라임 디자인, 움직이는 와이어프레임, 버튼으로 시작하는 공시 조회와 종목 리서치를 제공합니다.

[웹 버전](https://verdant-market-taeo.rlaxodh5.chatgpt.site) · 소유자 전용 접근

## 화면

### 데스크톱

![VERDANT 데스크톱](docs/images/verdant-desktop.jpg)

### 모바일 · 실제 DART 조회 후

<img src="docs/images/verdant-mobile.jpg" alt="390px 모바일에서 삼성전자 DART 공시 15건 조회" width="390">

[실제 조회 결과의 추가 화면](docs/images/verdant-actual-dart.jpg)

## 현재 기능

- 실제 DART 기업 목록으로 기업명·종목코드·고유번호 연결
- 기업별 최근 7·30·90일 공시와 코스피·코스닥 최근 공시 조회
- 접수번호·원문 링크·접수일·수집 시각, 정정공시 및 제목 유형 표시
- 실제 서버 작업 단계 표시, 취소·오류·빈 결과·부분 수집 처리
- 최근 5개 표시 리포트의 브라우저 저장, 당시 결과 재열기, JSON 내보내기
- 시장·업종 / 기업 공시 / 뉴스 시점으로 나누는 주가 움직임 분석 화면
- 단타·장기 후보, 업종 필터, 관심종목, 상세 리포트의 **가상 데모**
- 데스크톱·모바일 레이아웃과 `prefers-reduced-motion` 지원

## 실제 데이터와 데모의 구분

| 항목 | 상태 |
| --- | --- |
| DART 공시 조회 | PC 실행에서 실제 동작 |
| 공시 본문·재무 수치 분석 | 후속 개발 필요 |
| KRX 가격·거래량 | 코스피·코스닥 일별매매정보 실제 연결 완료 · 최근 최대 5거래일 |
| 뉴스 | 공급원 선정·연결 예정 |
| 후보 카드·지수·가격·기사·점수 | 가상 데모 |
| 실제 상승 후보 선정·가격 변동 원인 판단 | 가격·뉴스 연결 및 검증 필요 |

현재 Cloudflare 실행 환경에서는 DART 도메인 요청이 네트워크 오류로 실패합니다. PC에서는 실제 공시와 KRX 가격을 함께 조회할 수 있습니다. 클라우드 연결 문제 해결 전에는 PC 실행 버전을 이용합니다. KRX는 전일까지의 자료에서 최근 최대 5거래일을 조회하며 비수정 종가·전일 대비 등락률·거래량·거래대금·기준일을 제공합니다. 실시간 현재가나 전체 30·90일 수익률을 의미하지 않습니다. 뉴스·업종 비교가 없어 가격 변동 원인은 확정하지 않습니다.

## PC 실행

Node.js가 필요합니다. 기존 Codex PC 환경에서는 **`VERDANT 실행.cmd`를 더블클릭**하면 됩니다. 실행 파일은 현재 사용자 폴더의 Codex Node 런타임을 사용합니다.

다른 Node.js 환경에서는 저장소 폴더에서 다음과 같이 실행합니다. 이 로컬 서버는 별도의 패키지 설치 없이 Node 기본 모듈을 사용합니다.

```powershell
node scripts/local-dashboard.mjs
```

브라우저에서 [http://127.0.0.1:5177](http://127.0.0.1:5177)을 엽니다. 현재 로컬 서버는 **저장소의 상위 폴더에 있는 `DART API.txt`**를 읽습니다. 발급받은 40자리 키만 넣고, 키 파일을 Git에 올리지 마세요. 서버는 PC 내부 주소에만 바인딩하며, 키를 브라우저로 전달하지 않습니다.

## 웹 서버 개발

Node.js 22.13 이상에서 실행합니다.

```powershell
npm run install:ci
npm run dev
```

PC 실행은 상위 폴더의 `KRX API.txt`(또는 `KPX API.txt`)를 추가로 읽습니다. KRX 키는 요청 헤더 `AUTH_KEY`로만 전달합니다. 인증키 발급 외에 ‘유가증권 일별매매정보’와 ‘코스닥 일별매매정보’의 각각의 이용 승인이 필요합니다.

로컬 웹 개발에서는 `.dev.vars`에 `DART_API_KEY`, `KRX_API_KEY`를 설정하고 운영 환경에서는 같은 이름의 서버 secret을 사용합니다. `.openai/hosting.json`은 기존 Sites 배포 식별자를 보존합니다. 키와 로컬 환경 파일, 의존성, 빌드 결과는 저장소에서 제외됩니다.

## 검증

```powershell
node --test tests/research.test.mjs tests/krx.test.mjs
npm run build
```

- 단위 테스트 10개 통과: DART 6개 + KRX 숫자 정규화·권한 오류·과거 날짜 순회·통신 오류 4개
- 프로덕션 빌드 통과
- PC 실제 API 검사: 삼성전자 최근 30일 15건, SK하이닉스 4건 (2026-10-25 기준)
- 데스크톱·390px 모바일 브라우저에서 삼성전자 실제 조회 확인
- 2026-10-26: 두 KRX API 실제 HTTP 200, 삼성전자·SK하이닉스·JYP Ent.의 최근 5거래일 자료 확인. KRX 화면 변경 후의 브라우저 시각 검사는 접근 정책 때문에 수행하지 못했습니다.

### KRX API 승인 기록

![코스피·코스닥 일별매매정보 승인](docs/images/krx-approval-2026-10-26.png)

## 주요 파일

| 경로 | 용도 |
| --- | --- |
| `web/index.html` | 기존 목업을 바탕으로 한 화면 |
| `public/refined.css`, `public/refined.js` | 디자인·모션·실제 조회·기록 |
| `lib/market-research.mjs` | DART 수집·기업 매핑·공시 유형 분류 |
| `scripts/local-dashboard.mjs` | PC용 로컬 서버 |
| `app/api/` | 웹 서버의 연결 상태·공시 조회 API |
| `docs/images/` | 데스크톱·모바일·조회 화면 이미지 |
| [IMPLEMENTATION.md](IMPLEMENTATION.md) | 현재 구현과 제약 |
| [docs/RESEARCH.md](docs/RESEARCH.md) | 초기 조사와 공식 출처 |
| [CODEX_HANDOFF.md](CODEX_HANDOFF.md) | 원본 목업 인수인계 기록 |

PC 버전과 웹 버전의 브라우저 저장 기록은 자동 동기화되지 않습니다.
