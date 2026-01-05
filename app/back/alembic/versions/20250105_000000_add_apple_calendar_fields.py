"""Add Apple Calendar (CalDAV) sync fields.

Revision ID: 20250105_000000
Revises: 20250104_000000
Create Date: 2025-01-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20250105_000000"
down_revision: Union[str, None] = "20250104_000000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Apple Calendar fields to users table
    op.add_column(
        "users",
        sa.Column("apple_calendar_apple_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("apple_calendar_app_password", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("apple_calendar_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("apple_calendar_connected", sa.Boolean(), default=False, nullable=False, server_default="false"),
    )
    
    # Add Apple Calendar event UID to workout_sessions table
    op.add_column(
        "workout_sessions",
        sa.Column("apple_calendar_event_uid", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("workout_sessions", "apple_calendar_event_uid")
    op.drop_column("users", "apple_calendar_connected")
    op.drop_column("users", "apple_calendar_url")
    op.drop_column("users", "apple_calendar_app_password")
    op.drop_column("users", "apple_calendar_apple_id")
