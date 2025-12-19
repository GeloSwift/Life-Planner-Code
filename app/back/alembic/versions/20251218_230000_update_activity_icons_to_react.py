"""Update activity icons from emojis to React icon names.

Revision ID: 20251218_230000
Revises: 20251218_223426
Create Date: 2025-12-18 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'update_icons_react'
down_revision: Union[str, None] = '425f40a3a9d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade: change icon column size and update default icons to React names."""
    
    # 1. Augmenter la taille de la colonne icon (de 10 à 50 caractères)
    op.alter_column(
        'user_activity_types',
        'icon',
        type_=sa.String(50),
        existing_type=sa.String(10),
        existing_nullable=True
    )
    
    # 2. Mettre à jour les icônes par défaut avec des noms d'icônes React (Lucide)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = 'Dumbbell' 
        WHERE name = 'Musculation' AND is_default = true
    """)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = 'Footprints' 
        WHERE name = 'Course à pied' AND is_default = true
    """)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = 'Music' 
        WHERE name = 'Danse' AND is_default = true
    """)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = 'Volleyball' 
        WHERE name = 'Volleyball' AND is_default = true
    """)


def downgrade() -> None:
    """Downgrade: revert to emojis and smaller column size."""
    
    # Remettre les emojis
    op.execute("""
        UPDATE user_activity_types 
        SET icon = '💪' 
        WHERE name = 'Musculation' AND is_default = true
    """)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = '🏃' 
        WHERE name = 'Course à pied' AND is_default = true
    """)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = '💃' 
        WHERE name = 'Danse' AND is_default = true
    """)
    op.execute("""
        UPDATE user_activity_types 
        SET icon = '🏐' 
        WHERE name = 'Volleyball' AND is_default = true
    """)
    
    # Réduire la taille de la colonne
    op.alter_column(
        'user_activity_types',
        'icon',
        type_=sa.String(10),
        existing_type=sa.String(50),
        existing_nullable=True
    )
