**환경 생성**
- conda create -n AIX_PRACTICE_PROJECT_310 python=3.10 -y


**환경 활성화**
- conda activate AIX_PRACTICE_PROJECT_310


**요구사항 설치(경로 확인 필수)**
- pip install -r requirements/requirements.txt

---

**실행**
1. AIX_PRACTICE_PROJECT를 vscode에서 열기
2. AIX_PRACTICE_PROJECT_310 환경으로 세팅
3. 요구사항(requirements) 설치
4. 커맨드 창에 cd app 입력
5. 커맨드 창에 uvicorn main:app --reload 하여 백엔드 실행
6. http://127.0.0.1:8000/docs 접속하여 테스트 진행

---

**사이트 프로세스**
1. 회원가입 진행
2. 로그인 진행
3. 게시글 생성
4. 게시글 상세 페이지 접근
5. 게시글 상세 페이지 > 수정(본인 아니면 불가)
6. 게시글 상세 페이지 > 삭제(본인 아니면 불가)
7. 게시글 생성 후 댓글 작성
8. 게시글 생성 후 댓글 삭제(본인 아니면 불가)
9. 게시글 10개 이후 페이징 처리 진행
10. 검색 진행 가능
11. 상단 내정보 > 개인정보 수정, 비밀번호 변경, 탈퇴 가능

---

**폴더 구조**
- requirements 폴더 = 환경설정
- app = 백엔드, 프론트엔드, 디비 실질적으로 돌아가는 소스들의 root 폴더
- db 폴더 = database 연결, 테이블 구조 생성, fastapi에서 사용할 스키마 생성, main.py에서 사용할 import들의 init 파일
- fronted = user/admin 세분화, 각 확장자 별 세분화
- main.py = FastAPI 백엔드
