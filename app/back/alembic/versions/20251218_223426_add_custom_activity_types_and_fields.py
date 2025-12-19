"""Add custom activity types and fields

Revision ID: 425f40a3a9d2
Revises: 5f6d91509219
Create Date: 2025-12-18 22:34:26.482060+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '425f40a3a9d2'
down_revision: Union[str, None] = '5f6d91509219'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    
    # Note: L'enum 'customfieldtype' est créé automatiquement par SQLAlchemy
    # lors de l'import des modèles, donc pas besoin de le créer ici.
    
    # 1. Créer la table user_activity_types
    op.create_table(
        'user_activity_types',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('icon', sa.String(10), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_user_activity_types_user', 'user_activity_types', ['user_id'])
    
    # 2. Créer la table custom_field_definitions
    op.create_table(
        'custom_field_definitions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('activity_type_id', sa.Integer(), sa.ForeignKey('user_activity_types.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('field_type', sa.String(50), server_default='text', nullable=False),
        sa.Column('options', sa.Text(), nullable=True),
        sa.Column('unit', sa.String(20), nullable=True),
        sa.Column('placeholder', sa.String(100), nullable=True),
        sa.Column('default_value', sa.String(255), nullable=True),
        sa.Column('is_required', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # 3. Créer la table exercise_field_values
    op.create_table(
        'exercise_field_values',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('exercise_id', sa.Integer(), sa.ForeignKey('exercises.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('field_id', sa.Integer(), sa.ForeignKey('custom_field_definitions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index('ix_exercise_field_values_exercise_field', 'exercise_field_values', ['exercise_id', 'field_id'], unique=True)
    
    # 4. Ajouter les nouvelles colonnes à la table exercises
    op.add_column('exercises', sa.Column('gif_data', sa.Text(), nullable=True))
    op.add_column('exercises', sa.Column('custom_activity_type_id', sa.Integer(), sa.ForeignKey('user_activity_types.id', ondelete='SET NULL'), nullable=True))
    op.create_index('ix_exercises_custom_activity_type_id', 'exercises', ['custom_activity_type_id'])
    
    # 5. Insérer les types d'activités par défaut
    op.execute("""
        INSERT INTO user_activity_types (name, icon, is_default) VALUES
        ('Musculation', '💪', true),
        ('Course à pied', '🏃', true),
        ('Danse', '💃', true),
        ('Volleyball', '🏐', true)
    """)


def downgrade() -> None:
    """Downgrade database schema."""
    
    # Supprimer les colonnes ajoutées à exercises
    op.drop_index('ix_exercises_custom_activity_type_id', table_name='exercises')
    op.drop_column('exercises', 'custom_activity_type_id')
    op.drop_column('exercises', 'gif_data')
    
    # Supprimer les tables
    op.drop_index('ix_exercise_field_values_exercise_field', table_name='exercise_field_values')
    op.drop_table('exercise_field_values')
    op.drop_table('custom_field_definitions')
    op.drop_index('ix_user_activity_types_user', table_name='user_activity_types')
    op.drop_table('user_activity_types')
