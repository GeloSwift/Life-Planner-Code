"""add_custom_activity_type_ids_to_sessions

Revision ID: act_type_ids_sessions
Revises: add_custom_activity_type
Create Date: 2025-12-22 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "act_type_ids_sessions"
down_revision: Union[str, None] = "add_custom_activity_type"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Stockage JSON string des IDs d'activités de la séance
    op.add_column("workout_sessions", sa.Column("custom_activity_type_ids", sa.Text(), nullable=True))

    # Backfill depuis custom_activity_type_id (si présent)
    op.execute(
        """
        UPDATE workout_sessions
        SET custom_activity_type_ids = CONCAT('[', custom_activity_type_id::text, ']')
        WHERE custom_activity_type_id IS NOT NULL
          AND (custom_activity_type_ids IS NULL OR custom_activity_type_ids = '');
        """
    )


def downgrade() -> None:
    op.drop_column("workout_sessions", "custom_activity_type_ids")

