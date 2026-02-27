"""
patient intelligence - enrich patients and add medical records

Revision ID: a1b2c3d4e5f6
Revises: 668333e56462
Create Date: 2026-02-24 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '668333e56462'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
                CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER');
            END IF;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_type_enum') THEN
                CREATE TYPE record_type_enum AS ENUM ('LAB_RESULT', 'IMAGING', 'PRESCRIPTION', 'REFERRAL', 'CLINICAL_NOTE', 'OTHER');
            END IF;
        END $$
    """)

    _add_columns = [
        ('gender', 'gender_enum'),
        ('blood_type', 'VARCHAR(10)'),
        ('phone', 'VARCHAR(50)'),
        ('email', 'VARCHAR(255)'),
        ('emergency_contact_name', 'VARCHAR(255)'),
        ('emergency_contact_phone', 'VARCHAR(50)'),
        ('address_line', 'VARCHAR(500)'),
        ('city', 'VARCHAR(100)'),
        ('province', 'VARCHAR(100)'),
        ('country', 'VARCHAR(100)'),
        ('postal_code', 'VARCHAR(20)'),
        ('allergies', 'JSONB'),
        ('chronic_conditions', 'JSONB'),
        ('notes', 'TEXT'),
    ]
    for col_name, col_sql_type in _add_columns:
        op.execute(f"""
            DO $$ BEGIN
                ALTER TABLE patients ADD COLUMN {col_name} {col_sql_type};
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$
        """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_patients_city ON patients (city)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_patients_province ON patients (province)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS medical_records (
            id UUID NOT NULL PRIMARY KEY,
            patient_id UUID NOT NULL REFERENCES patients(id),
            record_type record_type_enum NOT NULL,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            file_path VARCHAR(500),
            raw_text TEXT,
            metadata_json JSONB,
            record_date TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            embedding vector(768)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_medical_records_patient_id ON medical_records (patient_id)")


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS medical_records')
    op.execute('DROP INDEX IF EXISTS ix_patients_province')
    op.execute('DROP INDEX IF EXISTS ix_patients_city')

    for col in (
        'notes', 'chronic_conditions', 'allergies', 'postal_code', 'country',
        'province', 'city', 'address_line', 'emergency_contact_phone',
        'emergency_contact_name', 'email', 'phone', 'blood_type', 'gender',
    ):
        op.execute(f'ALTER TABLE patients DROP COLUMN IF EXISTS {col}')

    op.execute('DROP TYPE IF EXISTS record_type_enum')
    op.execute('DROP TYPE IF EXISTS gender_enum')
