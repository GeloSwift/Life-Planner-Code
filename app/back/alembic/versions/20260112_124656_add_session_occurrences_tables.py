"""add_session_occurrences_tables

Revision ID: 82ab53c269eb
Revises: fc72c4313033
Create Date: 2026-01-12 12:46:56.644061+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '82ab53c269eb'
down_revision: Union[str, None] = 'fc72c4313033'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema - add session occurrences tables."""
    
    # Create workout_session_occurrences table
    op.create_table(
        'workout_session_occurrences',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('workout_sessions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('occurrence_date', sa.String(10), nullable=False),
        sa.Column('status', sa.String(20), server_default='planifiee', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('perceived_difficulty', sa.Integer(), nullable=True),
        sa.Column('calories_burned', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_session_occurrences_session_date', 'workout_session_occurrences', ['session_id', 'occurrence_date'])
    op.create_index('ix_session_occurrences_status', 'workout_session_occurrences', ['status'])
    
    # Create workout_occurrence_exercises table
    op.create_table(
        'workout_occurrence_exercises',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('occurrence_id', sa.Integer(), sa.ForeignKey('workout_session_occurrences.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('session_exercise_id', sa.Integer(), sa.ForeignKey('workout_session_exercises.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    
    # Create workout_occurrence_sets table
    op.create_table(
        'workout_occurrence_sets',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('occurrence_exercise_id', sa.Integer(), sa.ForeignKey('workout_occurrence_exercises.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('set_number', sa.Integer(), nullable=False),
        sa.Column('actual_reps', sa.Integer(), nullable=True),
        sa.Column('actual_weight', sa.Float(), nullable=True),
        sa.Column('actual_duration', sa.Integer(), nullable=True),
        sa.Column('actual_distance', sa.Float(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('rest_taken', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    """Downgrade database schema - remove session occurrences tables."""
    op.drop_table('workout_occurrence_sets')
    op.drop_table('workout_occurrence_exercises')
    op.drop_index('ix_session_occurrences_status', table_name='workout_session_occurrences')
    op.drop_index('ix_session_occurrences_session_date', table_name='workout_session_occurrences')
    op.drop_table('workout_session_occurrences')
