"""Add workout planner tables

Revision ID: 20251218_000000
Revises: 20251209_000000_increase_avatar_url_size
Create Date: 2024-12-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251218_000000'
down_revision: Union[str, None] = '20251209_000000_increase_avatar_url_size'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enums (en français)
    activitytype_enum = sa.Enum(
        'musculation', 'course', 'cyclisme', 'natation', 'volleyball',
        'boxe', 'basketball', 'football', 'tennis', 'yoga', 'crossfit',
        'hiit', 'danse', 'autre',
        name='activitytype'
    )
    musclegroup_enum = sa.Enum(
        'poitrine', 'dos', 'epaules', 'biceps', 'triceps', 'avant_bras',
        'abdominaux', 'obliques', 'lombaires', 'quadriceps', 'ischio_jambiers',
        'fessiers', 'mollets', 'adducteurs', 'corps_complet', 'cardio',
        name='musclegroup'
    )
    goaltype_enum = sa.Enum(
        'poids_corporel', 'poids_exercice', 'repetitions', 'temps_exercice',
        'distance', 'temps', 'nombre_seances', 'serie_consecutive',
        name='goaltype'
    )
    sessionstatus_enum = sa.Enum(
        'planifiee', 'en_cours', 'terminee', 'annulee',
        name='sessionstatus'
    )
    
    # Create enums in database
    activitytype_enum.create(op.get_bind(), checkfirst=True)
    musclegroup_enum.create(op.get_bind(), checkfirst=True)
    goaltype_enum.create(op.get_bind(), checkfirst=True)
    sessionstatus_enum.create(op.get_bind(), checkfirst=True)
    
    # Create exercises table
    op.create_table(
        'exercises',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('video_url', sa.String(1000), nullable=True),
        sa.Column('image_url', sa.String(1000), nullable=True),
        sa.Column('activity_type', activitytype_enum, nullable=False, server_default='musculation'),
        sa.Column('muscle_group', musclegroup_enum, nullable=True),
        sa.Column('secondary_muscles', sa.String(500), nullable=True),
        sa.Column('equipment', sa.String(255), nullable=True),
        sa.Column('difficulty', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('is_compound', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_exercises_id', 'exercises', ['id'])
    op.create_index('ix_exercises_user_id', 'exercises', ['user_id'])
    op.create_index('ix_exercises_activity_muscle', 'exercises', ['activity_type', 'muscle_group'])
    
    # Create workout_templates table
    op.create_table(
        'workout_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('activity_type', activitytype_enum, nullable=False, server_default='musculation'),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('estimated_duration', sa.Integer(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_workout_templates_id', 'workout_templates', ['id'])
    op.create_index('ix_workout_templates_user_id', 'workout_templates', ['user_id'])
    
    # Create workout_template_exercises table
    op.create_table(
        'workout_template_exercises',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('target_sets', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('target_reps', sa.Integer(), nullable=True),
        sa.Column('target_weight', sa.Float(), nullable=True),
        sa.Column('target_duration', sa.Integer(), nullable=True),
        sa.Column('target_distance', sa.Float(), nullable=True),
        sa.Column('rest_seconds', sa.Integer(), nullable=False, server_default='90'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['template_id'], ['workout_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_workout_template_exercises_id', 'workout_template_exercises', ['id'])
    op.create_index('ix_workout_template_exercises_template_id', 'workout_template_exercises', ['template_id'])
    op.create_index('ix_workout_template_exercises_exercise_id', 'workout_template_exercises', ['exercise_id'])
    
    # Create workout_sessions table
    op.create_table(
        'workout_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('activity_type', activitytype_enum, nullable=False, server_default='musculation'),
        sa.Column('status', sessionstatus_enum, nullable=False, server_default='planifiee'),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=True),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('perceived_difficulty', sa.Integer(), nullable=True),
        sa.Column('calories_burned', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['workout_templates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_workout_sessions_id', 'workout_sessions', ['id'])
    op.create_index('ix_workout_sessions_user_id', 'workout_sessions', ['user_id'])
    op.create_index('ix_workout_sessions_template_id', 'workout_sessions', ['template_id'])
    op.create_index('ix_workout_sessions_user_status', 'workout_sessions', ['user_id', 'status'])
    op.create_index('ix_workout_sessions_user_scheduled', 'workout_sessions', ['user_id', 'scheduled_at'])
    
    # Create workout_session_exercises table
    op.create_table(
        'workout_session_exercises',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('target_sets', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('target_reps', sa.Integer(), nullable=True),
        sa.Column('target_weight', sa.Float(), nullable=True),
        sa.Column('target_duration', sa.Integer(), nullable=True),
        sa.Column('target_distance', sa.Float(), nullable=True),
        sa.Column('rest_seconds', sa.Integer(), nullable=False, server_default='90'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_workout_session_exercises_id', 'workout_session_exercises', ['id'])
    op.create_index('ix_workout_session_exercises_session_id', 'workout_session_exercises', ['session_id'])
    op.create_index('ix_workout_session_exercises_exercise_id', 'workout_session_exercises', ['exercise_id'])
    
    # Create workout_sets table
    op.create_table(
        'workout_sets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_exercise_id', sa.Integer(), nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('distance', sa.Float(), nullable=True),
        sa.Column('is_warmup', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_dropset', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_failure', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rpe', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['session_exercise_id'], ['workout_session_exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_workout_sets_id', 'workout_sets', ['id'])
    op.create_index('ix_workout_sets_session_exercise_id', 'workout_sets', ['session_exercise_id'])
    
    # Create weight_entries table
    op.create_table(
        'weight_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('body_fat_percentage', sa.Float(), nullable=True),
        sa.Column('muscle_mass', sa.Float(), nullable=True),
        sa.Column('water_percentage', sa.Float(), nullable=True),
        sa.Column('measured_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_weight_entries_id', 'weight_entries', ['id'])
    op.create_index('ix_weight_entries_user_id', 'weight_entries', ['user_id'])
    op.create_index('ix_weight_entries_user_date', 'weight_entries', ['user_id', 'measured_at'])
    
    # Create goals table
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('goal_type', goaltype_enum, nullable=False),
        sa.Column('target_value', sa.Float(), nullable=False),
        sa.Column('current_value', sa.Float(), nullable=False, server_default='0'),
        sa.Column('initial_value', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(50), nullable=False),
        sa.Column('exercise_id', sa.Integer(), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('achieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_achieved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_goals_id', 'goals', ['id'])
    op.create_index('ix_goals_user_id', 'goals', ['user_id'])
    op.create_index('ix_goals_exercise_id', 'goals', ['exercise_id'])
    op.create_index('ix_goals_user_active', 'goals', ['user_id', 'is_active'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_goals_user_active', table_name='goals')
    op.drop_index('ix_goals_exercise_id', table_name='goals')
    op.drop_index('ix_goals_user_id', table_name='goals')
    op.drop_index('ix_goals_id', table_name='goals')
    op.drop_table('goals')
    
    op.drop_index('ix_weight_entries_user_date', table_name='weight_entries')
    op.drop_index('ix_weight_entries_user_id', table_name='weight_entries')
    op.drop_index('ix_weight_entries_id', table_name='weight_entries')
    op.drop_table('weight_entries')
    
    op.drop_index('ix_workout_sets_session_exercise_id', table_name='workout_sets')
    op.drop_index('ix_workout_sets_id', table_name='workout_sets')
    op.drop_table('workout_sets')
    
    op.drop_index('ix_workout_session_exercises_exercise_id', table_name='workout_session_exercises')
    op.drop_index('ix_workout_session_exercises_session_id', table_name='workout_session_exercises')
    op.drop_index('ix_workout_session_exercises_id', table_name='workout_session_exercises')
    op.drop_table('workout_session_exercises')
    
    op.drop_index('ix_workout_sessions_user_scheduled', table_name='workout_sessions')
    op.drop_index('ix_workout_sessions_user_status', table_name='workout_sessions')
    op.drop_index('ix_workout_sessions_template_id', table_name='workout_sessions')
    op.drop_index('ix_workout_sessions_user_id', table_name='workout_sessions')
    op.drop_index('ix_workout_sessions_id', table_name='workout_sessions')
    op.drop_table('workout_sessions')
    
    op.drop_index('ix_workout_template_exercises_exercise_id', table_name='workout_template_exercises')
    op.drop_index('ix_workout_template_exercises_template_id', table_name='workout_template_exercises')
    op.drop_index('ix_workout_template_exercises_id', table_name='workout_template_exercises')
    op.drop_table('workout_template_exercises')
    
    op.drop_index('ix_workout_templates_user_id', table_name='workout_templates')
    op.drop_index('ix_workout_templates_id', table_name='workout_templates')
    op.drop_table('workout_templates')
    
    op.drop_index('ix_exercises_activity_muscle', table_name='exercises')
    op.drop_index('ix_exercises_user_id', table_name='exercises')
    op.drop_index('ix_exercises_id', table_name='exercises')
    op.drop_table('exercises')
    
    # Drop enums
    sa.Enum(name='sessionstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='goaltype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='musclegroup').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='activitytype').drop(op.get_bind(), checkfirst=True)
