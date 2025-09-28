# 환경
- 환경 생성
- conda create -n AIX_PRACTICE_PROJECT_310 python=3.10 -y

- 환경 활성화
- conda activate AIX_PRACTICE_PROJECT_310

- 요구사항 설치(경로 확인 필수)
- pip install -r requirements/requirements.txt



# 실행
1. AIX_PRACTICE_PROJECT를 vscode에서 열기
2. AIX_PRACTICE_PROJECT_310 환경으로 세팅
3. 요구사항(requirements) 설치
4. 커맨드 창에 cd app 입력
5. 커맨드 창에 uvicorn main:app --reload 하여 백엔드 실행
6. http://127.0.0.1:8000/docs 접속하여 테스트 진행



# http://127.0.0.1:8000/docs 설명
○ /userInfo(GET) - 유저 정보 확인
○ /userCreate(POST) - 유저 생성
○ /userPwUpdate(PATCH) - 유저 비밀번호 변경
○ /userLogin(POST) - 로그인
