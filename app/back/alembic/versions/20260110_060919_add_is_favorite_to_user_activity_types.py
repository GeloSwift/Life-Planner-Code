"""add is_favorite to user_activity_types

Revision ID: fc72c4313033
Revises: add_recurrence_exceptions
Create Date: 2026-01-10 06:09:19.135143+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fc72c4313033'
down_revision: Union[str, None] = 'add_recurrence_exceptions'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    # Add is_favorite column to user_activity_types
    op.add_column(
        'user_activity_types',
        sa.Column('is_favorite', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade() -> None:
    """Downgrade database schema."""
    # Remove is_favorite column from user_activity_types
    op.drop_column('user_activity_types', 'is_favorite')
