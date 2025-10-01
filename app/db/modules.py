# models.py는 데이터베이스의 기본 세팅이라 보면 됩니다.
# 각 class는 테이블 생성이고 테이블 생성 시 필요한 테이블 이름, 설정, 컬럼의 정보들을 기입합니다.

# database.py에서 연결한 db 테이블과 매핑시키는 역할
from sqlalchemy import String, Integer, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column

# date, datetimne형 데이터를 넣기 위한 import
from datetime import date, datetime

# database.py에 Base를 가져옴
from .database import Base

# =====================================================================================================================================
# 작성 예시(회원 정보 테이블) -> 추후 사이트 컨셉 정해지면 작성할 예정
class UserInfo(Base):
    # 테이블 이름 지정
    __tablename__= "user"

    # 테이블의 comment, charset 지정
    __table_args__ = {
        "comment" : "회원 정보 테이블",
        "mysql_charset" : "utf8mb4"
    }
    
    # int형 기본키, 숫자 자동 추가 / 예시 : 13
    no_seq : Mapped[int] = mapped_column(primary_key = True, autoincrement = True, comment = "자동 index 번호") # index = true는 primary key로 지정을 해두면 default 값이라 없어도 됨

    # 30 길이의 varchar형 컬럼, 중복 불가, null 불가 / 예시 : idid12
    user_id : Mapped[str] = mapped_column(String(30), unique = True, nullable = False, comment = "사용자 아이디")

    # 100 길이의 varchar형 컬럼, null 불가 / 예시 : $2b$12$LfDgkLra5gUAzz61yVh.JerDqtb6Z.jpKeCrgimNbh2Jw2tEQe4Zq
    user_pw : Mapped[str] = mapped_column(String(100), nullable = False, comment = "사용자 비밀번호")

    # 45 길이의 varchar형 컬럼, 중복 불가, null 불가 / 예시 : email12@naver.com
    user_email : Mapped[str] = mapped_column(String(45), unique = True, nullable = False, comment = "사용자 이메일")

    # 100 길이의 varchar형 컬럼, null 불가 / 예시 : 서울 관악구 남부순환로 1633
    user_addr1 : Mapped[str] = mapped_column(String(100), nullable = False, comment = "사용자 주소")

    # 100 길이의 varchar형 컬럼 / 예시 : 7~8층
    user_addr2 : Mapped[str] = mapped_column(String(100), comment = "사용자 상세주소")

    # 5 길이의 varchar형 컬럼, null 불가 / 예시 : 08754
    user_post : Mapped[str] = mapped_column(String(5), nullable = False, comment = "사용자 우편번호")

    # date형 컬럼, null 불가 / 기본값 = 2000-01-01 / 예시 : 2000-01-01
    user_birth : Mapped[date] = mapped_column(Date, nullable = False, insert_default = "2000-01-01", comment = "사용자 생년월일")

    # datetime형 컬럼, null 불가 / 기본값 = datetime.now() / 예시 : 2000-01-01 00:00:00
    user_create_date : Mapped[datetime] = mapped_column(DateTime, nullable = False, insert_default = datetime.now(), comment = "계정 생성일")

    # datetime형 컬럼 / 기본값 = datetime.now() / 예시 : 2000-01-01 00:00:00
    user_update_date : Mapped[datetime] = mapped_column(DateTime, insert_default = datetime.now(), comment = "계정 수정일")

    # datetime형 컬럼 / 기본값 = datetime.now(),  예시 : 2000-01-01 00:00:00
    user_delete_date : Mapped[datetime] = mapped_column(DateTime, insert_default = datetime.now(), comment = "계정 삭제일")

    # 1 길이의 varchar형 컬럼, 기본값 = "N", null 불가 / 예시 : Y
    user_delete_yn : Mapped[str] = mapped_column(String(1), insert_default = "N", comment = "계정 삭제 체크")



# =====================================================================================================================================
# 관리자 정보 테이블 (추가) 10.01유진작성
# =====================================================================================================================================
class AdminInfo(Base):
    """
    관리자 정보 테이블
    - ERD의 admin 테이블과 매핑
    - 관리자 로그인 및 권한 관리에 사용
    """
    # 테이블 이름 지정
    __tablename__ = "admin"
    
    # 테이블의 comment, charset 지정
    __table_args__ = {
        "comment": "관리자 정보 테이블",
        "mysql_charset": "utf8mb4"
    }
    
    # int형 기본키, 숫자 자동 추가
    no_seq: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="자동 index 번호")
    
    # 30 길이의 varchar형 컬럼, 중복 불가, null 불가
    admin_id: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, comment="관리자 아이디")
    
    # 100 길이의 varchar형 컬럼, null 불가
    admin_pw: Mapped[str] = mapped_column(String(100), nullable=False, comment="관리자 비밀번호")
    
    # 10 길이의 varchar형 컬럼 - 관리자 구분 (슈퍼, 일반 등)
    admin_gubun: Mapped[str] = mapped_column(String(10), nullable=False, insert_default="ADMIN", comment="관리자 구분")
    
    # datetime형 컬럼, null 불가
    admin_create_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, insert_default=datetime.now(), comment="관리자 계정 생성일")
    
    # datetime형 컬럼
    admin_update_date: Mapped[datetime] = mapped_column(DateTime, insert_default=datetime.now(), comment="관리자 계정 수정일")
    
    # datetime형 컬럼
    admin_delete_date: Mapped[datetime] = mapped_column(DateTime, insert_default=datetime.now(), comment="관리자 계정 삭제일")
    
    # 1 길이의 varchar형 컬럼, 기본값 = "N"
    admin_delete_yn: Mapped[str] = mapped_column(String(1), insert_default="N", nullable=False, comment="관리자 계정 삭제 체크")

# =====================================================================================================================================

# 자유 게시판 / 새로운 테이블 생성 시 이렇게 할 거 같은디
# class FreeBoard(Base):
#     __tablename__ = "freeboard"

#     __table_args__ = {
#         "comment" : "자유 게시판",
#         "mysql_charset" : "utf8mb4"
#     }

    # 블라블라 컬럼 생성


# =====================================================================================================================================
