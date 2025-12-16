"""Increase avatar_url size to support base64 data URLs

Revision ID: 4b5c90498108
Revises: 3a4f89387097
Create Date: 2025-12-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b5c90498108'
down_revision: Union[str, None] = '3a4f89387097'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Increase avatar_url column size to support base64 data URLs."""
    # Change avatar_url from String(500) to String(500000) to support base64 data URLs
    # PostgreSQL TEXT type can handle up to ~1GB, but we limit to 500KB for practical reasons
    op.alter_column(
        'users',
        'avatar_url',
        existing_type=sa.String(500),
        type_=sa.String(500000),
        existing_nullable=True
    )


def downgrade() -> None:
    """Revert avatar_url column size back to 500 characters."""
    op.alter_column(
        'users',
        'avatar_url',
        existing_type=sa.String(500000),
        type_=sa.String(500),
        existing_nullable=True
    )

