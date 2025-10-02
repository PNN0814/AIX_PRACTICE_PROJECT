# DB 값을 불러올 때 틀 지정 endpoint? 이게 endpoint인가
# 추후 FastAPI에서 @app.get, @app.post 이런 거 할 때 schemas.py의 객체들을 불러와 값의 틀을 세팅할 수 있음

# BaseModel = 타입 검증? 그럴 거임 > int형인데 str형 들어오면 오류 처리
# ConfigDict = 찾아보니 ORM 객체와 Pydantic 모델 변환 문제 > ORM 객체의 attribute를 읽어서 Pydantic 모델에 매핑
# SecretStr = 비밀번호를 평문으로 보내면 안됨. 암호화가 아니라 마스킹 처리함! ******** 이렇게
# Field - 필수값 세팅
# EmailStr = 이메일 형식이 맞는지 체크 해주는 거
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from pydantic.types import SecretStr

# Optional = null 데이터 처리? 느낌
# Literal = 무조건 이런 값이여야 한다고 지정하는 거
from typing import Optional, Literal

# date형 데이터를 넣기 위한 import
from datetime import date, datetime

# form 데이터를 받기 위한 import
from fastapi import Form

# =====================================================================================================================================

# 공통 베이스
class UserBase(BaseModel):
    user_id : Optional[str] = None
    user_email : Optional[EmailStr] = None
    user_addr1 : Optional[str] = None
    user_addr2 : Optional[str] = None
    user_post : Optional[str] = None
    user_birth : Optional[date] = None
    user_delete_yn : Literal["Y", "N"] = "N"

# =====================================================================================================================================

# Base를 BaseModel이 아닌 UserBase로 지정
# UserBase에서 필수인 값들만 지정
class UserCreate(UserBase):
    user_id : str = Field(...)
    user_pw : SecretStr = Field(...)
    user_email : EmailStr = Field(...)
    user_addr1 : str = Field(...)
    user_post : str = Field(...)
    user_birth : date = Field(...)

    @classmethod
    def form(
        userCreateForm,
        user_id : str = Form(...),
        user_pw : SecretStr = Form(...),
        user_email : EmailStr = Form(...),
        user_addr1 : str = Form(...),
        user_addr2 : str = Form(...),
        user_post : str = Form(...),
        user_birth : str = Form(...)
    ):
        return userCreateForm(
            user_id = user_id,
            user_pw = user_pw,
            user_email = user_email,
            user_addr1 = user_addr1,
            user_addr2 = user_addr2,
            user_post = user_post,
            user_birth = user_birth
        )

# =====================================================================================================================================

# 유저 비밀번호 수정
# 비밀번호는 따로 수정할 수 있게
class UserPwUpdate(BaseModel):
    now_user_pw : SecretStr = Field(...)
    new_user_pw : SecretStr = Field(...)

    @classmethod
    def form(
        userPwUpdateForm,
        now_user_pw : SecretStr = Form(...),
        new_user_pw : SecretStr = Form(...)
    ):
        return userPwUpdateForm(
            now_user_pw = now_user_pw,
            new_user_pw = new_user_pw
        )

# =====================================================================================================================================

# 유저 수정 Base
# UserBase와 비슷하지만 나눈 이유는 결국 모든 유저 정보 수정이 아니라 부분 수정이기 때문
class UserUpdate(BaseModel):
    user_email : Optional[EmailStr] = None
    user_addr1 : Optional[str] = None
    user_addr2 : Optional[str] = None
    user_post : Optional[str] = None
    user_birth : Optional[date] = None

    @classmethod
    def form(
        userUpdateForm,
        user_email : EmailStr = Form(...),
        user_addr1 : str = Form(...),
        user_addr2 : str = Form(...),
        user_post : str = Form(...),
        user_birth : str = Form(...)
    ):
        return userUpdateForm(
            user_email = user_email,
            user_addr1 = user_addr1,
            user_addr2 = user_addr2,
            user_post = user_post,
            user_birth = user_birth
        )

# =====================================================================================================================================

# 유저 삭제 Base
# 삭제 시 비밀번호 체크만 할 것이기에 이것만 있어도 상관 없음
class UserDelete(BaseModel):
    user_pw : SecretStr = Field(...)

# =====================================================================================================================================

# 유저 상세 Base
# 상세 페이지 접근 시 seq 번호로 값 가져올거임 ㅎㅎ
# model_config는 응답(ORM)하는 페이지에서만 세팅! 요청(dict)은 쓰지 않음!
class UserRead(UserBase):
    no_seq: int

    @classmethod
    def form(
        userUpdateForm,
        no_seq : int = Form(...),
        user_id : str = Form(...),
        user_email : EmailStr = Form(...),
        user_addr1 : str = Form(...),
        user_addr2 : str = Form(...),
        user_post : str = Form(...),
        user_birth : str = Form(...)
    ):
        return userUpdateForm(
            no_seq = no_seq,
            user_id = user_id,
            user_email = user_email,
            user_addr1 = user_addr1,
            user_addr2 = user_addr2,
            user_post = user_post,
            user_birth = user_birth
        )

    model_config = ConfigDict(from_attributes = True)

# =====================================================================================================================================

# 로그인
class UserLogin(BaseModel):
    user_id : str = Field(...)
    user_pw : SecretStr = Field(...)

    @classmethod
    def form(
        userLoginForm,
        user_id : str = Form(...),
        user_pw : str = Form(...),
    ):
        return userLoginForm(
            user_id = user_id,
            user_pw = user_pw
        )
    
# =====================================================================================================================================
# 여기서부터 추거(신효빈)
# 게시판 관련 스키마

# 게시글 생성
class BoardCreate(BaseModel):
    board_title : str = Field(..., min_length=1, max_length=200)
    board_content : str = Field(..., min_length=1, max_length=5000)

# =====================================================================================================================================

# 게시글 수정
class BoardUpdate(BaseModel):
    board_title : Optional[str] = Field(None, min_length=1, max_length=200)
    board_content : Optional[str] = Field(None, min_length=1, max_length=5000)

# =====================================================================================================================================

# 게시글 상세 조회 (응답)
class BoardRead(BaseModel):
    board_seq : int
    user_seq : int
    user_id : str  # 작성자 아이디 (JOIN)
    board_title : str
    board_content : str
    board_view : int
    board_create_date : datetime
    board_update_date : datetime
    board_delete_yn : str

    model_config = ConfigDict(from_attributes=True)

# =====================================================================================================================================

# 게시글 목록 조회 (간단 버전)
class BoardList(BaseModel):
    board_seq : int
    user_id : str
    board_title : str
    board_view : int
    board_create_date : datetime

    model_config = ConfigDict(from_attributes=True)

# =====================================================================================================================================
# 댓글 관련 스키마

# 댓글 생성
class CommentCreate(BaseModel):
    comment_content : str = Field(..., min_length=1, max_length=1000)

# =====================================================================================================================================

# 댓글 조회 (응답)
class CommentRead(BaseModel):
    comment_seq : int
    board_seq : int
    user_seq : int
    user_id : str  # 작성자 아이디 (JOIN)
    comment_content : str
    comment_create_date : datetime
    comment_delete_yn : str

    model_config = ConfigDict(from_attributes=True)

# =====================================================================================================================================