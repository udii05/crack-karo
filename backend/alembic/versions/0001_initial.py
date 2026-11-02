"""Initial schema baseline.

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-02
"""
from typing import Sequence, Union

from alembic import op

from app import models  # noqa: F401
from app.database import Base

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline for a fresh database. Future changes must be explicit,
    # reviewable Alembic revisions rather than runtime ALTER statements.
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
