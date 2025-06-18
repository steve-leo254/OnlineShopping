#!/usr/bin/env python3
"""
Migration script to add email verification fields to the users table.
Run this script to update your existing database.
"""

import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()


def run_migration():
    """Add email verification fields to users table"""
    password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "localhost")
    db_name = os.getenv("DB_NAME", "ecommerce")
    # Get database URL from environment
    database_url = f"mysql+pymysql://root:{password}@{db_host}:3306/{db_name}"

    if not database_url:
        print("Error: DATABASE_URL not found in environment variables")
        sys.exit(1)

    # Create engine
    engine = create_engine(database_url)

    try:
        with engine.connect() as conn:
            # Check if columns already exist
            result = conn.execute(
                text(
                    """
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'users' 
                AND COLUMN_NAME IN ('is_verified', 'verification_token', 'verification_expires')
            """
                )
            )

            existing_columns = [row[0] for row in result.fetchall()]

            # Add columns if they don't exist
            if "is_verified" not in existing_columns:
                print("Adding is_verified column...")
                conn.execute(
                    text(
                        """
                    ALTER TABLE users 
                    ADD COLUMN is_verified BOOLEAN DEFAULT FALSE NOT NULL
                """
                    )
                )
                print("✓ is_verified column added")

            if "verification_token" not in existing_columns:
                print("Adding verification_token column...")
                conn.execute(
                    text(
                        """
                    ALTER TABLE users 
                    ADD COLUMN verification_token VARCHAR(255) NULL
                """
                    )
                )
                print("✓ verification_token column added")

            if "verification_expires" not in existing_columns:
                print("Adding verification_expires column...")
                conn.execute(
                    text(
                        """
                    ALTER TABLE users 
                    ADD COLUMN verification_expires DATETIME NULL
                """
                    )
                )
                print("✓ verification_expires column added")

            # Set existing users as verified (for backward compatibility)
            print("Setting existing users as verified...")
            conn.execute(
                text(
                    """
                UPDATE users 
                SET is_verified = TRUE 
                WHERE is_verified IS NULL OR is_verified = FALSE
            """
                )
            )
            print("✓ Existing users marked as verified")

            conn.commit()
            print("\n🎉 Migration completed successfully!")

    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    print("Starting email verification migration...")
    run_migration()
