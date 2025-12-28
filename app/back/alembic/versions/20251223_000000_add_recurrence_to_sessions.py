"""add recurrence to sessions

Revision ID: add_recurrence_sessions
Revises: act_type_ids_sessions
Create Date: 2025-12-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "add_recurrence_sessions"
down_revision: Union[str, None] = "act_type_ids_sessions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter les colonnes de récurrence
    op.add_column("workout_sessions", sa.Column("recurrence_type", sa.String(20), nullable=True))
    op.add_column("workout_sessions", sa.Column("recurrence_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("workout_sessions", "recurrence_data")
    op.drop_column("workout_sessions", "recurrence_type")
