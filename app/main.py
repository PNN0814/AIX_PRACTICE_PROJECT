# FastAPI 세팅
from fastapi import FastAPI, HTTPException, Request, Form, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse

from typing import List, Optional
from sqlalchemy import select, func, and_, or_ # 1001 신효빈 추가 func, and_, or_
from datetime import datetime

# 암복호화
import bcrypt

# ~~~\AIX_PRACTICE_PROJECT\app까지의 기본 경로를 잡기 위한 import
import os

# modules 객체 import
from db import Base, UserInfo, AdminInfo , FreeBoard, BoardComment # 1001 신효빈 추가 FreeBoard, BoardComment

# schemas 객체 import
from db import UserBase, UserCreate, UserRead, UserUpdate, UserDelete, UserPwUpdate, UserLogin, BoardCreate, BoardUpdate, BoardRead, BoardList, CommentCreate, CommentRead
 # 1001 신효빈 추가 BoardCreate, BoardUpdate, BoardRead, BoardList, CommentCreate, CommentRead

# admin_schemas 객체 import -1001 유진수정
from db import AdminLoginRequest, AdminLoginResponse, AdminPasswordChange

# database 객체 import
from db import engine, session_factory

# =====================================================================================================================================

# create_all 처리
Base.metadata.create_all(bind = engine)

app = FastAPI()

# CORS 설정
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_methods = ["*"],
    allow_headers = ["*"]
)

# =====================================================================================================================================

# 다른 환경에서도 경로를 바로 잡기 위한 변수 추가(~~~\AIX_PRACTICE_PROJECT\app 까지의 경로 세팅)
BASE_DIR = os.path.dirname(__file__)

# user or admin frondend 경로
USER_DIR    = os.path.join(BASE_DIR, "frontend", "user")
ADMIN_DIR   = os.path.join(BASE_DIR, "frontend", "admin")

# @app.mount("URL을 통해서 불러올 경로 값")
# 사용자 페이지에서 사용할 파일들 mount
app.mount("/static/user/css",      StaticFiles(directory = os.path.join(USER_DIR, "css")),     name = "user_css")
app.mount("/static/user/js",       StaticFiles(directory = os.path.join(USER_DIR, "js")),      name = "user_js")
app.mount("/static/user/image",    StaticFiles(directory = os.path.join(USER_DIR, "image")),   name = "user_image")

# 관리자 페이지에서 사용할 파일들 mount
app.mount("/static/admin/css",     StaticFiles(directory = os.path.join(ADMIN_DIR, "css")),    name = "admin_css")
app.mount("/static/admin/js",      StaticFiles(directory = os.path.join(ADMIN_DIR, "js")),     name = "admin_js")
app.mount("/static/admin/image",   StaticFiles(directory = os.path.join(ADMIN_DIR, "image")),  name = "admin_image")

# html 파일 세팅
user_temp = Jinja2Templates(directory = os.path.join(USER_DIR, "html"))
admin_temp = Jinja2Templates(directory = os.path.join(ADMIN_DIR, "html"))

# =====================================================================================================================================

# 유저 전체 조회 - 쓰지 않음
# @app.get("/", response_class = HTMLResponse)
# def main_load(request: Request):
#     with session_factory() as db:
#         # no_seq로 특정 유저 정보 조회
#         stmt = select(UserInfo)
#         query = db.execute(stmt).scalars().all()
        
#         # 해당 no_seq의 유저가 없으면
#         if not query:
#             raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")
        
#         userReadData = [UserRead.model_validate(q) for q in query]

#     return user_temp.TemplateResponse("index.html", {"request" : request, "data" : userReadData})

# =====================================================================================================================================

# 특정 유저 조회 - 쓰지 않음
# @app.get("/userInfo/{no_seq}", response_class = HTMLResponse)
# def user_read(no_seq : int, request: Request):
#     with session_factory() as db:
#         # no_seq로 특정 유저 정보 조회
#         stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
#         query = db.execute(stmt).scalar_one_or_none()
        
#         # 해당 no_seq의 유저가 없으면
#         if not query:
#             raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")
        
#         userInfoData = UserRead.model_validate(query)

#         return user_temp.TemplateResponse("userInfo.html", {"request" : request, "data" : userInfoData})

# =====================================================================================================================================

# 회원 정보 생성 - 2025-10-01 정기홍
@app.get("/userCreatePage", response_class = HTMLResponse)
async def user_create_page(request: Request):
    return user_temp.TemplateResponse("signup.html", {"request": request})

# =====================================================================================================================================

# 사용자 생성 - 2025-10-01 정기홍
@app.post("/userCreate")
def user_create(data: UserCreate = Depends(UserCreate.form)):
    with session_factory() as db:
        # 비밀번호 암호화
        encrypt_user_pw = bcrypt.hashpw(
            data.user_pw.get_secret_value().encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # 데이터 세팅
        db_user = UserInfo(
            user_id = data.user_id,
            user_pw = encrypt_user_pw,
            user_email = data.user_email,
            user_addr1 = data.user_addr1,
            user_addr2 = data.user_addr2,
            user_post = data.user_post,
            user_birth = data.user_birth,
            user_create_date = datetime.now(),
            user_delete_yn = "N"
        )
        
        # 세션에 db_user(데이터 세팅 변수) 추가
        db.add(db_user)

        # 세션 저장(commit)
        db.commit()

        # 세션 새로고침(python 정보)
        db.refresh(db_user)

        return {"success" : True, "message" : "회원가입이 완료 되었습니다!"}
    
# =====================================================================================================================================

# 사용자 비밀번호 변경 - 2025-10-01 정기홍
@app.patch("/userPwUpdate/{no_seq}")
def user_pw_update(no_seq : int, data: UserPwUpdate = Depends(UserPwUpdate.form)):
    with session_factory() as db:
        # 유저의 정보 가져오기(암호화 되어있음)
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()

        # no_seq의 회원의 데이터가 없으면
        if not query:
            return {"success" : False, "message" : "일치한 회원 정보가 없습니다."}
            # raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")

        # 입력된 현재 비밀번호 검증
        if not bcrypt.checkpw(data.now_user_pw.get_secret_value().encode("utf-8"), query.user_pw.encode("utf-8")):
            return {"success" : False, "message" : "현재 비밀번호가 일치하지 않습니다."}
            # raise HTTPException(status_code = 400, detail = "현재 비밀번호가 일치하지 않습니다.")

        # 새로운 비번 암호화
        encrypt_new_user_pw = bcrypt.hashpw(
            data.new_user_pw.get_secret_value().encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # 일치하는 no_seq 회원의 비번을 새롭게 암호화한 비번으로 변경
        query.user_pw = encrypt_new_user_pw
        db.commit()
        db.refresh(query)
        
        return {"success" : True, "message" : "비밀번호가 정상적으로 변경 되었습니다."}

# =====================================================================================================================================

# 0929_신효빈-delete 삭제 추가 - 사용하지 않음
# 삭제 - delete
# @app.patch("/userDelete/{no_seq}")
# def user_delete(no_seq:int, data : UserDelete):
#     with session_factory() as db:
#         stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
#         query = db.execute(stmt).scalar_one_or_none()

#         # no_seq의 회원의 데이터가 없으면
#         if not query:
#             raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")
        
#          # 입력된 현재 비밀번호 검증
#         if not bcrypt.checkpw(data.user_pw.get_secret_value().encode("utf-8"), query.user_pw.encode("utf-8")):
#             raise HTTPException(status_code = 400, detail = "현재 비밀번호가 일치하지 않습니다.")
        
#         query.user_delete_yn = "Y"
#         db.commit()
#         db.refresh(query)
        
#         return {"msg" : "계정이 삭제되었습니다."}

# =====================================================================================================================================

# 회원 정보 수정 페이지 - 2025-10-01 정기홍
@app.get("/userUpdatePage/{no_seq}", response_class = HTMLResponse)
def user_update_page(request : Request, no_seq : int):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()
        if not query:
            return user_temp.TemplateResponse("login.html", {"request" : request, "error" : "해당 회원 없음"})
            # raise HTTPException(status_code=404, detail="해당 회원 없음")

        userUpdateData = UserRead.model_validate(query)

        return user_temp.TemplateResponse("mypage.html", {"request": request, "data" : userUpdateData})

# =====================================================================================================================================

# 회원 정보 수정 - 2025-10-01 정기홍
@app.put("/userUpdate/{no_seq}")
def user_update(no_seq: int, data: UserUpdate = Depends(UserUpdate.form)):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()
        if not query:
            return {"success": False, "message": "해당 회원 없음"}
            # raise HTTPException(status_code=404, detail="해당 회원 없음")
        
        query.user_email = data.user_email
        query.user_addr1 = data.user_addr1
        query.user_addr2 = data.user_addr2
        query.user_post = data.user_post

        db.commit()
        db.refresh(query)

        return {"success": True, "message": "수정이 완료되었습니다."}

# =====================================================================================================================================

# 회원 비활성화 - 2025-10-01 정기홍
@app.patch("/userDeactivate/{no_seq}")
def user_deactivate(no_seq: int):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()

        if not query:
            return {"success" : False, "message" : "해당 회원이 없습니다."}
            # raise HTTPException(status_code=404, detail="해당 회원 없음")
        
        query.user_delete_yn = "Y"

        db.commit()
        db.refresh(query)

        return {"success" : True, "message" : "비활성화가 완료 되었습니다."}

# =====================================================================================================================================

# 로그인 페이지 - 2025-10-01 정기홍
@app.get("/", response_class = HTMLResponse)
async def login_page(request: Request):
    return user_temp.TemplateResponse("login.html", {"request": request})

# 로그인 시 - 2025-10-01 정기홍
@app.post("/LoginCheck")
def user_login(request : Request, data: UserLogin = Depends(UserLogin.form)):
    with session_factory() as db:
        # 아이디로 유저 검색
        stmt = select(UserInfo).where(UserInfo.user_id == data.user_id)
        query = db.execute(stmt).scalar_one_or_none()
        # 만약 id가 존재하지 않으면
        if not query or query.user_delete_yn == "Y":
            return {"success" : False, "message" : "일치한 아이디 정보가 없습니다."}
            # raise HTTPException(status_code = 404, detail = "일치한 아이디 정보가 없습니다.")

        # 여까지 넘어오면 아이디는 있다는 거 > 비번 검증 시작
        if not bcrypt.checkpw(data.user_pw.get_secret_value().encode("utf-8"), query.user_pw.encode("utf-8")):
            return {"success" : False, "message" : "비밀번호가 일치하지 않습니다."}
            # raise HTTPException(status_code = 400, detail = "비밀번호가 일치하지 않습니다.")
        
        userLoginData = UserRead.model_validate(query)

        return {"success" : True, "data" : userLoginData}
        # return user_temp.TemplateResponse("index.html", {"request" : request, "data" : userLoginData})

# 10.01 수정사항(유진)==================================================================================================================
# =====================================================================================================================================
# 관리자 권한 체크 함수 (의존성)
# =====================================================================================================================================

def get_current_admin_user(authorization: Optional[str] = Header(None)):
    """
    관리자 권한 체크
    TODO: JWT 토큰 기반 인증으로 변경 권장
    """
    # 임시: 헤더 검증 없이 진행 (개발용)
    return {"admin_gubun": "ADMIN"}

# =====================================================================================================================================
# 관리자 API (Admin API) - /admin/ prefix
# =====================================================================================================================================

# 관리자 로그인 페이지 - 2025-10-02 이유진
@app.get("/admin/loginPage", response_class = HTMLResponse)
async def login_page(request: Request):
    return admin_temp.TemplateResponse("admin_login.html", {"request": request})

# 로그인 처리 프로세스 - 2025-10-02 이유진
@app.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(data: AdminLoginRequest):
    """
    관리자 로그인
    - admin 테이블에서 조회
    - admin_delete_yn = 'N'인 계정만 로그인 가능
    """
    with session_factory() as db:
        # admin_id로 관리자 검색
        stmt = select(AdminInfo).where(AdminInfo.admin_id == data.admin_id)
        admin = db.execute(stmt).scalar_one_or_none()

        if not admin:
            raise HTTPException(status_code=404, detail="일치한 관리자 정보가 없습니다.")

        # 비활성화된 계정 체크
        if admin.admin_delete_yn == "Y":
            raise HTTPException(status_code=403, detail="비활성화된 관리자 계정입니다.")

        # 비밀번호 검증
        if not bcrypt.checkpw(data.admin_pw.get_secret_value().encode("utf-8"), admin.admin_pw.encode("utf-8")):
            raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

        return admin


# ========== 유저 관리 API ==========

@app.get("/admin/users", response_model=List[UserBase])
def admin_get_users(
    skip: int = 0,
    limit: int = 100,
    current_admin = Depends(get_current_admin_user)
):
    """관리자: 전체 유저 목록 조회"""
    with session_factory() as db:
        stmt = select(UserInfo).offset(skip).limit(limit)
        users = db.execute(stmt).scalars().all()
        return users


@app.get("/admin/users/{no_seq}", response_model=UserRead)
def admin_get_user(no_seq: int, current_admin = Depends(get_current_admin_user)):
    """관리자: 특정 유저 상세 조회"""
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원이 없습니다.")
        return user


@app.post("/admin/users", response_model=UserCreate)
def admin_create_user(data: UserCreate, current_admin = Depends(get_current_admin_user)):
    """관리자: 유저 추가"""
    with session_factory() as db:
        # 중복 체크
        stmt = select(UserInfo).where(UserInfo.user_id == data.user_id)
        if db.execute(stmt).scalar_one_or_none():
            raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")

        # 비밀번호 암호화
        encrypt_pw = bcrypt.hashpw(data.user_pw.get_secret_value().encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        db_user = UserInfo(
            user_id=data.user_id, user_pw=encrypt_pw, user_email=data.user_email,
            user_addr1=data.user_addr1, user_addr2=data.user_addr2,
            user_post=data.user_post, user_birth=data.user_birth,
            user_create_date=datetime.now(), user_delete_yn="N"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


@app.patch("/admin/users/{no_seq}", response_model=UserUpdate)
def admin_update_user(no_seq: int, data: UserUpdate, current_admin = Depends(get_current_admin_user)):
    """관리자: 유저 정보 수정"""
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원이 없습니다.")
        
        user.user_email = data.user_email
        user.user_addr1 = data.user_addr1
        user.user_addr2 = data.user_addr2
        user.user_post = data.user_post
        db.commit()
        db.refresh(user)
        return user


@app.patch("/admin/users/{no_seq}/password")
def admin_change_user_password(no_seq: int, data: AdminPasswordChange, current_admin = Depends(get_current_admin_user)):
    """관리자: 유저 비밀번호 강제 변경"""
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원이 없습니다.")
        
        new_pw = data.new_password.get_secret_value()
        if len(new_pw) < 8:
            raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 합니다.")
        
        encrypt_pw = bcrypt.hashpw(new_pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user.user_pw = encrypt_pw
        db.commit()
        return {"msg": "비밀번호가 변경되었습니다.", "success": True}


@app.patch("/admin/users/{no_seq}/deactivate")
def admin_deactivate_user(no_seq: int, current_admin = Depends(get_current_admin_user)):
    """관리자: 유저 비활성화"""
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원이 없습니다.")
        
        user.user_delete_yn = "Y"
        db.commit()
        return {"msg": "유저가 비활성화되었습니다.", "success": True}


@app.delete("/admin/users/{no_seq}")
def admin_delete_user(no_seq: int, current_admin = Depends(get_current_admin_user)):
    """관리자: 유저 완전 삭제"""
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원이 없습니다.")
        
        db.delete(user)
        db.commit()
        return {"msg": "유저가 삭제되었습니다.", "success": True}

# =====================================================================================================================================
# 게시판 API 1001 신효빈 추가 
# =====================================================================================================================================

# 게시글 목록 조회 (검색, 페이징, 댓글 개수 포함)
@app.get("/board/list")
def board_list(
    search_type: Optional[str] = None,
    search_keyword: Optional[str] = None,
    page: int = 1,
    size: int = 10
):
    with session_factory() as db:
        # 댓글 개수 서브쿼리
        comment_count_subquery = (
            select(
                BoardComment.board_seq,
                func.count(BoardComment.comment_seq).label('comment_count')
            )
            .where(BoardComment.comment_delete_yn == "N")
            .group_by(BoardComment.board_seq)
            .subquery()
        )
        
        # 기본 쿼리
        stmt = select(
            FreeBoard.board_seq,
            FreeBoard.board_title,
            FreeBoard.board_view,
            FreeBoard.board_create_date,
            UserInfo.user_id,
            func.coalesce(comment_count_subquery.c.comment_count, 0).label('comment_count')
        ).join(
            UserInfo, FreeBoard.user_seq == UserInfo.no_seq
        ).outerjoin(
            comment_count_subquery, FreeBoard.board_seq == comment_count_subquery.c.board_seq
        ).where(
            FreeBoard.board_delete_yn == "N"
        )

        # 검색 조건
        if search_keyword and search_type:
            if search_type == "title":
                stmt = stmt.where(FreeBoard.board_title.like(f"%{search_keyword}%"))
            elif search_type == "content":
                stmt = stmt.where(FreeBoard.board_content.like(f"%{search_keyword}%"))
            elif search_type == "all":
                stmt = stmt.where(
                    or_(
                        FreeBoard.board_title.like(f"%{search_keyword}%"),
                        FreeBoard.board_content.like(f"%{search_keyword}%")
                    )
                )

        # 정렬 및 페이징
        stmt = stmt.order_by(FreeBoard.board_create_date.desc())
        offset = (page - 1) * size
        stmt = stmt.offset(offset).limit(size)

        results = db.execute(stmt).all()

        return [
            {
                "board_seq": row.board_seq,
                "user_id": row.user_id,
                "board_title": row.board_title,
                "board_view": row.board_view,
                "board_create_date": row.board_create_date,
                "comment_count": row.comment_count
            }
            for row in results
        ]

# 게시글 상세 조회
@app.get("/board/{board_seq}", response_model=BoardRead)
def board_detail(board_seq: int):
    with session_factory() as db:
        stmt = select(
            FreeBoard,
            UserInfo.user_id
        ).join(
            UserInfo, FreeBoard.user_seq == UserInfo.no_seq
        ).where(
            and_(
                FreeBoard.board_seq == board_seq,
                FreeBoard.board_delete_yn == "N"
            )
        )

        result = db.execute(stmt).first()

        if not result:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

        board, user_id = result

        # 조회수 증가
        board.board_view += 1
        db.commit()
        db.refresh(board)

        return BoardRead(
            board_seq=board.board_seq,
            user_seq=board.user_seq,
            user_id=user_id,
            board_title=board.board_title,
            board_content=board.board_content,
            board_view=board.board_view,
            board_create_date=board.board_create_date,
            board_update_date=board.board_update_date,
            board_delete_yn=board.board_delete_yn
        )

# 게시글 작성
@app.post("/board/create", response_model=BoardRead)
def board_create(data: BoardCreate, user_seq: int):
    with session_factory() as db:
        # 유저 존재 확인
        user_stmt = select(UserInfo).where(UserInfo.no_seq == user_seq)
        user = db.execute(user_stmt).scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="존재하지 않는 유저입니다.")

        # 게시글 생성
        new_board = FreeBoard(
            user_seq=user_seq,
            board_title=data.board_title,
            board_content=data.board_content,
            board_view=0,
            board_create_date=datetime.now(),
            board_update_date=datetime.now(),
            board_delete_yn="N"
        )

        db.add(new_board)
        db.commit()
        db.refresh(new_board)

        return BoardRead(
            board_seq=new_board.board_seq,
            user_seq=new_board.user_seq,
            user_id=user.user_id,
            board_title=new_board.board_title,
            board_content=new_board.board_content,
            board_view=new_board.board_view,
            board_create_date=new_board.board_create_date,
            board_update_date=new_board.board_update_date,
            board_delete_yn=new_board.board_delete_yn
        )

# 게시글 수정
@app.patch("/board/{board_seq}", response_model=BoardRead)
def board_update(board_seq: int, data: BoardUpdate, user_seq: int):
    with session_factory() as db:
        stmt = select(FreeBoard).where(
            and_(
                FreeBoard.board_seq == board_seq,
                FreeBoard.board_delete_yn == "N"
            )
        )
        board = db.execute(stmt).scalar_one_or_none()

        if not board:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

        if board.user_seq != user_seq:
            raise HTTPException(status_code=403, detail="게시글을 수정할 권한이 없습니다.")

        if data.board_title:
            board.board_title = data.board_title
        if data.board_content:
            board.board_content = data.board_content

        board.board_update_date = datetime.now()

        db.commit()
        db.refresh(board)

        user_stmt = select(UserInfo).where(UserInfo.no_seq == user_seq)
        user = db.execute(user_stmt).scalar_one()

        return BoardRead(
            board_seq=board.board_seq,
            user_seq=board.user_seq,
            user_id=user.user_id,
            board_title=board.board_title,
            board_content=board.board_content,
            board_view=board.board_view,
            board_create_date=board.board_create_date,
            board_update_date=board.board_update_date,
            board_delete_yn=board.board_delete_yn
        )

# 게시글 삭제
@app.delete("/board/{board_seq}")
def board_delete(board_seq: int, user_seq: int):
    with session_factory() as db:
        stmt = select(FreeBoard).where(
            and_(
                FreeBoard.board_seq == board_seq,
                FreeBoard.board_delete_yn == "N"
            )
        )
        board = db.execute(stmt).scalar_one_or_none()

        if not board:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

        if board.user_seq != user_seq:
            raise HTTPException(status_code=403, detail="게시글을 삭제할 권한이 없습니다.")

        board.board_delete_yn = "Y"
        db.commit()

        return {"msg": "게시글이 삭제되었습니다."}

# =====================================================================================================================================
# 댓글 API
# =====================================================================================================================================

# 댓글 목록 조회
@app.get("/board/{board_seq}/comments", response_model=List[CommentRead])
def comment_list(board_seq: int):
    with session_factory() as db:
        stmt = select(
            BoardComment,
            UserInfo.user_id
        ).join(
            UserInfo, BoardComment.user_seq == UserInfo.no_seq
        ).where(
            and_(
                BoardComment.board_seq == board_seq,
                BoardComment.comment_delete_yn == "N"
            )
        ).order_by(BoardComment.comment_create_date.asc())

        results = db.execute(stmt).all()

        comments = []
        for comment, user_id in results:
            comments.append(CommentRead(
                comment_seq=comment.comment_seq,
                board_seq=comment.board_seq,
                user_seq=comment.user_seq,
                user_id=user_id,
                comment_content=comment.comment_content,
                comment_create_date=comment.comment_create_date,
                comment_delete_yn=comment.comment_delete_yn
            ))

        return comments

# 댓글 작성
@app.post("/board/{board_seq}/comments", response_model=CommentRead)
def comment_create(board_seq: int, data: CommentCreate, user_seq: int):
    with session_factory() as db:
        # 게시글 존재 확인
        board_stmt = select(FreeBoard).where(
            and_(
                FreeBoard.board_seq == board_seq,
                FreeBoard.board_delete_yn == "N"
            )
        )
        board = db.execute(board_stmt).scalar_one_or_none()

        if not board:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

        # 유저 존재 확인
        user_stmt = select(UserInfo).where(UserInfo.no_seq == user_seq)
        user = db.execute(user_stmt).scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="존재하지 않는 유저입니다.")

        # 댓글 생성
        new_comment = BoardComment(
            board_seq=board_seq,
            user_seq=user_seq,
            comment_content=data.comment_content,
            comment_create_date=datetime.now(),
            comment_delete_yn="N"
        )

        db.add(new_comment)
        db.commit()
        db.refresh(new_comment)

        return CommentRead(
            comment_seq=new_comment.comment_seq,
            board_seq=new_comment.board_seq,
            user_seq=new_comment.user_seq,
            user_id=user.user_id,
            comment_content=new_comment.comment_content,
            comment_create_date=new_comment.comment_create_date,
            comment_delete_yn=new_comment.comment_delete_yn
        )

# 댓글 삭제
@app.delete("/board/{board_seq}/comments/{comment_seq}")
def comment_delete(board_seq: int, comment_seq: int, user_seq: int):
    with session_factory() as db:
        stmt = select(BoardComment).where(
            and_(
                BoardComment.comment_seq == comment_seq,
                BoardComment.board_seq == board_seq,
                BoardComment.comment_delete_yn == "N"
            )
        )
        comment = db.execute(stmt).scalar_one_or_none()

        if not comment:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

        if comment.user_seq != user_seq:
            raise HTTPException(status_code=403, detail="댓글을 삭제할 권한이 없습니다.")

        comment.comment_delete_yn = "Y"
        db.commit()

        return {"msg": "댓글이 삭제되었습니다."}
    

