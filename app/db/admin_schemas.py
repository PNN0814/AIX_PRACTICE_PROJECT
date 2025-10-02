"""
관리자 관련 스키마
- 관리자 전용 유저 관리, 게시글 관리 등
"""

from pydantic import BaseModel, ConfigDict, Field, EmailStr
from pydantic.types import SecretStr
from typing import Optional, List
from datetime import date, datetime

# =====================================================================================================================================
# 관리자 로그인
# =====================================================================================================================================

class AdminLoginRequest(BaseModel):
    """관리자 로그인 요청"""
    admin_id: str = Field(..., description="관리자 아이디")
    admin_pw: SecretStr = Field(..., description="비밀번호")


class AdminLoginResponse(BaseModel):
    """관리자 로그인 응답"""
    no_seq: int
    admin_id: str
    admin_gubun: str
    token: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# =====================================================================================================================================
# 관리자: 유저 관리
# =====================================================================================================================================

class AdminPasswordChange(BaseModel):
    """관리자가 유저 비밀번호 강제 변경"""
    new_password: SecretStr = Field(..., min_length=8)


# =====================================================================================================================================
# 관리자: 게시글 관리 (TODO: 게시글 테이블 구현 후 사용)
# =====================================================================================================================================

class PostBase(BaseModel):
    """게시글 기본 정보"""
    id: int
    title: str
    content: str
    author: str
    create_date: Optional[datetime] = None
    views: int = 0
    is_pinned: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class PostCreate(BaseModel):
    """게시글 작성 요청"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    author: str
    is_pinned: bool = False


class PostUpdate(BaseModel):
    """게시글 수정 요청"""
    title: Optional[str] = None
    content: Optional[str] = None