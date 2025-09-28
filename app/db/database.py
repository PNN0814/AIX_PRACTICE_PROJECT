# database.py는 DB에 연결을 위한 세팅 파일입니다.
# 연결을 위한 URL, 예외 처리, 세션 생성을 해둡니다.

# DB(mysql)를 sqlalchemy 라이브러리를 사용해 통해 연결
from sqlalchemy import *
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# 변수 세팅
USERNAME    = "root"
PASSWORD    = "1234"
HOST        = "localhost"
PORT        = "3306"
DBNAME      = "AIX_PRACTICE_PROJECT"
SERVER_URL  = ""
DB_URL      = ""

# DB 연동을 위한 URL 세팅 / 일단 DB 없이 mysql 접속 > 추후 연결 시 DB 없으면 자동 생성을 위해서
# AUTOCOMMIT은 DDL에서 필수인 사항 - 몰?루 항상 이렇게 만들었었음
SERVER_URL = f"mysql+pymysql://{USERNAME}:{PASSWORD}@{HOST}:{PORT}"
server_engine = create_engine(SERVER_URL, isolation_level = "AUTOCOMMIT")

# 연결을 해보고 테이블이 없으면 생성, 기본 문자를 utf8mb4로 지정 < 이거 지정 안 하면 깨질 수 있음 ㅋㅋ
try:
    with server_engine.connect() as conn:
        conn.execute(
            text(f"CREATE DATABASE IF NOT EXISTS {DBNAME} DEFAULT CHARACTER SET utf8mb4;")
        )

        print(f"{DBNAME} 확인 또는 생성을 완료 했습니다.")
except SQLAlchemyError as e:
    print(f"{DBNAME} 확인 또는 생성을 실패 했습니다.\n{e}")

# DB가 생성 되었을 것이니 다시 접속 시도 / echo를 True로 해두면 쿼리 로그가 출력됨
DB_URL = f"{SERVER_URL}/{DBNAME}"
engine = create_engine(DB_URL, echo = True)

# Base 객체 생성 / 추후 models에 ex(Base)처럼 할건데 Base를 상속 안 해주면 단순 class라 문제가 발생함
# 발생할 수 있는 문제 : table 자동 생성이 안됨 등
class Base(DeclarativeBase):
    pass

# 세션 팩토리 생성 > 일정한 세션에서 계속 불러오기 위함
# autocommit = False는 기본 값이라 뺌 / 1.x 시절에 사용했던 거라네용 호홍
# autoflush = False 쿼리 자동 실행 방지? 쿼리를 반영 하려면 직접 쿼리를 돌려야 함(commit(), flush() 등)
session_factory = sessionmaker(autoflush = False, bind = engine)