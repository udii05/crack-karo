import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings

# Ensure SQLite directory exists regardless of CWD
if settings.database_url.startswith("sqlite"):
    db_path = settings.database_url.replace("sqlite:///", "", 1)
    db_file = Path(db_path)
    db_file.parent.mkdir(parents=True, exist_ok=True)

database_url = settings.database_url
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine_kwargs = {"pool_pre_ping": True}
if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs.update({"pool_size": 5, "max_overflow": 10})

engine = create_engine(database_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _run_lightweight_migrations() -> None:
    """Apply small, idempotent schema updates for existing SQLite databases."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as connection:
        user_columns = [
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(users)")
        ]
        if "plan" in user_columns:
            connection.exec_driver_sql("ALTER TABLE users DROP COLUMN plan")

        interview_columns = [
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(interviews)")
        ]
        if interview_columns and "duration_minutes" not in interview_columns:
            connection.exec_driver_sql(
                "ALTER TABLE interviews ADD COLUMN duration_minutes "
                "INTEGER NOT NULL DEFAULT 30"
            )

        question_columns = [
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(questions)")
        ]
        if question_columns and "position" not in question_columns:
            connection.exec_driver_sql(
                "ALTER TABLE questions ADD COLUMN position "
                "INTEGER NOT NULL DEFAULT 0"
            )

        skill_columns = [
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(skills)")
        ]
        if skill_columns and "self_rated" not in skill_columns:
            connection.exec_driver_sql(
                "ALTER TABLE skills ADD COLUMN self_rated "
                "BOOLEAN NOT NULL DEFAULT 0"
            )
        if skill_columns and "proficiency" not in skill_columns:
            connection.exec_driver_sql(
                "ALTER TABLE skills ADD COLUMN proficiency "
                "INTEGER NOT NULL DEFAULT 1"
            )
            connection.exec_driver_sql(
                "UPDATE skills SET proficiency = CASE "
                "WHEN level >= 88 THEN 4 "
                "WHEN level >= 63 THEN 3 "
                "WHEN level >= 38 THEN 2 "
                "ELSE 1 END"
            )


_run_lightweight_migrations()


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
