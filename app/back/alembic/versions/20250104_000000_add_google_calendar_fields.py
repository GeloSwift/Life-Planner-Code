"""Add Google Calendar sync fields.

Revision ID: 20250104_000000
Revises: 20251218_000000_add_workout_planner_tables
Create Date: 2025-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20250104_000000"
down_revision: Union[str, None] = "20251223_000000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Google Calendar fields to users table
    op.add_column(
        "users",
        sa.Column("google_calendar_refresh_token", sa.String(500), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("google_calendar_connected", sa.Boolean(), default=False, nullable=False, server_default="false"),
    )
    
    # Add Google Calendar event ID to workout_sessions table
    op.add_column(
        "workout_sessions",
        sa.Column("google_calendar_event_id", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("workout_sessions", "google_calendar_event_id")
    op.drop_column("users", "google_calendar_connected")
    op.drop_column("users", "google_calendar_refresh_token")
