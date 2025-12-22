"""add_custom_activity_type_to_templates_and_sessions

Revision ID: add_custom_activity_type
Revises: 425f40a3a9d2
Create Date: 2025-12-22 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_custom_activity_type'
down_revision: Union[str, None] = 'update_icons_react'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter custom_activity_type_id à workout_templates
    op.add_column('workout_templates', sa.Column('custom_activity_type_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_workout_templates_custom_activity_type',
        'workout_templates',
        'user_activity_types',
        ['custom_activity_type_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index(op.f('ix_workout_templates_custom_activity_type_id'), 'workout_templates', ['custom_activity_type_id'], unique=False)
    
    # Ajouter custom_activity_type_id à workout_sessions
    op.add_column('workout_sessions', sa.Column('custom_activity_type_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_workout_sessions_custom_activity_type',
        'workout_sessions',
        'user_activity_types',
        ['custom_activity_type_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index(op.f('ix_workout_sessions_custom_activity_type_id'), 'workout_sessions', ['custom_activity_type_id'], unique=False)


def downgrade() -> None:
    # Supprimer custom_activity_type_id de workout_sessions
    op.drop_index(op.f('ix_workout_sessions_custom_activity_type_id'), table_name='workout_sessions')
    op.drop_constraint('fk_workout_sessions_custom_activity_type', 'workout_sessions', type_='foreignkey')
    op.drop_column('workout_sessions', 'custom_activity_type_id')
    
    # Supprimer custom_activity_type_id de workout_templates
    op.drop_index(op.f('ix_workout_templates_custom_activity_type_id'), table_name='workout_templates')
    op.drop_constraint('fk_workout_templates_custom_activity_type', 'workout_templates', type_='foreignkey')
    op.drop_column('workout_templates', 'custom_activity_type_id')
