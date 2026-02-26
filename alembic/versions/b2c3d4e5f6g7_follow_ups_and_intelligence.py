"""Add follow_ups table and follow-up enums.

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b2c3d4e5f6g7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_up_type_enum') THEN
                CREATE TYPE follow_up_type_enum AS ENUM ('appointment', 'lab_check', 'medication_review', 'symptom_check', 'custom');
            END IF;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'follow_up_status_enum') THEN
                CREATE TYPE follow_up_status_enum AS ENUM ('pending', 'completed', 'overdue', 'cancelled');
            END IF;
        END $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS follow_ups (
            id UUID NOT NULL PRIMARY KEY,
            consultation_id UUID NOT NULL REFERENCES consultations(id),
            patient_id UUID NOT NULL REFERENCES patients(id),
            doctor_id UUID NOT NULL REFERENCES doctors(id),
            follow_up_type follow_up_type_enum NOT NULL,
            description TEXT NOT NULL,
            due_date TIMESTAMP WITH TIME ZONE NOT NULL,
            status follow_up_status_enum DEFAULT 'pending',
            ai_generated BOOLEAN DEFAULT false,
            ai_reasoning TEXT,
            completed_at TIMESTAMP WITH TIME ZONE,
            outcome_notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_follow_ups_patient_id ON follow_ups (patient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_follow_ups_doctor_id ON follow_ups (doctor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_follow_ups_status ON follow_ups (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_follow_ups_due_date ON follow_ups (due_date)")


def downgrade() -> None:
    op.drop_index("ix_follow_ups_due_date")
    op.drop_index("ix_follow_ups_status")
    op.drop_index("ix_follow_ups_doctor_id")
    op.drop_index("ix_follow_ups_patient_id")
    op.drop_table("follow_ups")

    op.execute("DROP TYPE IF EXISTS follow_up_type_enum")
    op.execute("DROP TYPE IF EXISTS follow_up_status_enum")
