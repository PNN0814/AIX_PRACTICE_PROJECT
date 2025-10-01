# FastAPI 세팅
from fastapi import FastAPI, HTTPException, , Depends, Header # Depends, Header 추가
from fastapi.middleware.cors import CORSMiddleware

from typing import List,Optional # Optional 추가
from sqlalchemy import select
from datetime import datetime

# 암복호화
import bcrypt

# modules 객체 import
from db import Base, UserInfo, AdminInfo #AdminInfo 추가

# schemas 객체 import
from db import UserBase, UserCreate, UserRead, UserUpdate, UserDelete, UserPwUpdate, UserLogin

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
# get = read (특정 유저 조회)
@app.get("/userInfo/{no_seq}", response_model = UserRead)
def user_read(no_seq : int):
    with session_factory() as db:
        # no_seq로 특정 유저 정보 조회
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()
        
        # 해당 no_seq의 유저가 없으면
        if not query:
            raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")
        
        return query

# =====================================================================================================================================

# post = create
@app.post("/userCreate", response_model = UserCreate)
def user_create(data : UserCreate):
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

        return db_user
    
# =====================================================================================================================================

# 부분 수정 - patch
@app.patch("/userPwUpdate/{no_seq}")
def user_pw_update(no_seq : int, data : UserPwUpdate):
    with session_factory() as db:
        # 유저의 정보 가져오기(암호화 되어있음)
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()

        # no_seq의 회원의 데이터가 없으면
        if not query:
            raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")

        # 입력된 현재 비밀번호 검증
        if not bcrypt.checkpw(data.now_user_pw.get_secret_value().encode("utf-8"), query.user_pw.encode("utf-8")):
            raise HTTPException(status_code = 400, detail = "현재 비밀번호가 일치하지 않습니다.")

        # 새로운 비번 암호화
        encrypt_new_user_pw = bcrypt.hashpw(
            data.new_user_pw.get_secret_value().encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # 일치하는 no_seq 회원의 비번을 새롭게 암호화한 비번으로 변경
        query.user_pw = encrypt_new_user_pw
        db.commit()
        db.refresh(query)
        
        return {"msg" : "비밀번호가 정상적으로 변경 되었습니다."}

# =====================================================================================================================================

# 0929_신효빈-delete 삭제 추가
# 삭제 - delete
@app.patch("/userDelete/{no_seq}")
def user_delete(no_seq:int, data : UserDelete):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()

        # no_seq의 회원의 데이터가 없으면
        if not query:
            raise HTTPException(status_code=404, detail="일치한 회원 정보가 없습니다.")
        
         # 입력된 현재 비밀번호 검증
        if not bcrypt.checkpw(data.user_pw.get_secret_value().encode("utf-8"), query.user_pw.encode("utf-8")):
            raise HTTPException(status_code = 400, detail = "현재 비밀번호가 일치하지 않습니다.")
        
        query.user_delete_yn = "Y"
        db.commit()
        db.refresh(query)
        
        return {"msg" : "계정이 삭제되었습니다."}


#=====================================================================================================================================

# 0930_이유진 - 내정보 수정 추가
# 내정보 수정 - update
@app.patch("/userUpdate/{no_seq}", response_model=UserUpdate)
def user_update(no_seq: int, data: UserUpdate):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원 없음")
        user.user_email = data.user_email
        user.user_addr1 = data.user_addr1
        user.user_addr2 = data.user_addr2
        user.user_post = data.user_post
        db.commit()
        db.refresh(user)
        return user

# 회원 비활성화
@app.patch("/userDeactivate/{no_seq}")
def user_deactivate(no_seq: int):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        user = db.execute(stmt).scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="해당 회원 없음")
        user.user_delete_yn = "Y"
        db.commit()
        return {"msg": "비활성화 처리 완료"}

# =====================================================================================================================================

# 회원 정보 수정
@app.put("/userUpdate/{no_seq}", response_model = UserBase)
def user_update(no_seq : int, data : UserUpdate):
    with session_factory() as db:
        stmt = select(UserInfo).where(UserInfo.no_seq == no_seq)
        query = db.execute(stmt).scalar_one_or_none()

        if not query:
            raise HTTPException(status_code = 404, detail = "회원 정보가 없습니다.")
        
        query.user_email = data.user_email
        query.user_addr1 = data.user_addr1
        query.user_addr2 = data.user_addr2
        query.user_post = data.user_post
        query.user_birth = data.user_birth

        db.commit()
        db.refresh(query)

        return query

# =====================================================================================================================================

# 간단한 로그인 테스트
@app.post("/userLogin", response_model = UserBase)
def user_login(data : UserLogin):
    with session_factory() as db:
        # 아이디로 유저 검색
        stmt = select(UserInfo).where(UserInfo.user_id == data.user_id)
        query = db.execute(stmt).scalar_one_or_none()

        # 만약 id가 존재하지 않으면
        if not query:
            raise HTTPException(status_code = 404, detail = "일치한 아이디 정보가 없습니다.")

        # 여까지 넘어오면 아이디는 있다는 거 > 비번 검증 시작
        if not bcrypt.checkpw(data.user_pw.get_secret_value().encode("utf-8"), query.user_pw.encode("utf-8")):
            raise HTTPException(status_code = 400, detail = "비밀번호가 일치하지 않습니다.")
        

        return query


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






