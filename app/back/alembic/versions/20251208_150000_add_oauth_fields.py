"""Add OAuth fields to users table

Revision ID: 3a4f89387097
Revises: 2e3f78276986
Create Date: 2025-12-08 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a4f89387097'
down_revision: Union[str, None] = '2e3f78276986'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add OAuth-related fields to users table."""
    # Create enum type for auth providers
    auth_provider_enum = sa.Enum('local', 'google', 'apple', name='authprovider')
    auth_provider_enum.create(op.get_bind(), checkfirst=True)
    
    # Add auth_provider column with default 'local'
    op.add_column(
        'users',
        sa.Column(
            'auth_provider',
            auth_provider_enum,
            nullable=False,
            server_default='local'
        )
    )
    
    # Add provider_user_id for OAuth users
    op.add_column(
        'users',
        sa.Column('provider_user_id', sa.String(255), nullable=True)
    )
    
    # Add avatar_url for profile pictures
    op.add_column(
        'users',
        sa.Column('avatar_url', sa.String(500), nullable=True)
    )
    
    # Add is_email_verified flag
    op.add_column(
        'users',
        sa.Column('is_email_verified', sa.Boolean(), nullable=False, server_default='false')
    )
    
    # Make hashed_password nullable (OAuth users don't have passwords)
    op.alter_column(
        'users',
        'hashed_password',
        existing_type=sa.String(255),
        nullable=True
    )
    
    # Create index on provider_user_id for faster OAuth lookups
    op.create_index('ix_users_provider_user_id', 'users', ['provider_user_id'])


def downgrade() -> None:
    """Remove OAuth-related fields from users table."""
    # Drop index
    op.drop_index('ix_users_provider_user_id', table_name='users')
    
    # Remove columns
    op.drop_column('users', 'is_email_verified')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'provider_user_id')
    op.drop_column('users', 'auth_provider')
    
    # Make hashed_password non-nullable again
    op.alter_column(
        'users',
        'hashed_password',
        existing_type=sa.String(255),
        nullable=False
    )
    
    # Drop enum type
    auth_provider_enum = sa.Enum('local', 'google', 'apple', name='authprovider')
    auth_provider_enum.drop(op.get_bind(), checkfirst=True)

