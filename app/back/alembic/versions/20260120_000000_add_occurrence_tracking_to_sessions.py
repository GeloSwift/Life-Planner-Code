"""Add occurrence tracking to workout sessions

Permet le suivi individuel des occurrences de séances récurrentes.
- parent_session_id: lien vers la session parente (template de récurrence)
- occurrence_date: date spécifique de cette occurrence
- recurrence_end_date: date de fin de la récurrence

Revision ID: 20260120_000000
Revises: 20260110_060919
Create Date: 2026-01-20

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260120_000000'
down_revision = 'fc72c4313033'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajouter parent_session_id (FK vers workout_sessions.id)
    op.add_column('workout_sessions', sa.Column(
        'parent_session_id',
        sa.Integer(),
        sa.ForeignKey('workout_sessions.id', ondelete='SET NULL'),
        nullable=True
    ))
    
    # Ajouter occurrence_date (date spécifique de l'occurrence)
    op.add_column('workout_sessions', sa.Column(
        'occurrence_date',
        sa.Date(),
        nullable=True
    ))
    
    # Ajouter recurrence_end_date (date de fin de la récurrence)
    op.add_column('workout_sessions', sa.Column(
        'recurrence_end_date',
        sa.Date(),
        nullable=True
    ))
    
    # Index pour les requêtes sur parent_session_id
    op.create_index(
        'ix_workout_sessions_parent_session_id',
        'workout_sessions',
        ['parent_session_id']
    )
    
    # Index pour les requêtes sur occurrence_date
    op.create_index(
        'ix_workout_sessions_occurrence_date',
        'workout_sessions',
        ['occurrence_date']
    )


def downgrade() -> None:
    op.drop_index('ix_workout_sessions_occurrence_date', table_name='workout_sessions')
    op.drop_index('ix_workout_sessions_parent_session_id', table_name='workout_sessions')
    op.drop_column('workout_sessions', 'recurrence_end_date')
    op.drop_column('workout_sessions', 'occurrence_date')
    op.drop_column('workout_sessions', 'parent_session_id')
