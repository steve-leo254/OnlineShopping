from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

load_dotenv()

password = os.getenv("DB_PASSWORD")


db_name = os.getenv("DB_NAME", "ecommerce")
db_host = os.getenv("DB_HOST", "localhost")
URL_DATABASE = f"mysql+pymysql://root:{password}@{db_host}:3306/{db_name}"

engine = create_engine(URL_DATABASE)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]