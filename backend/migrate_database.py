#!/usr/bin/env python3
"""
Database migration script to add Verifily features
Adds new columns to existing tables without losing data
"""

import sqlite3
import os

DB_PATH = "poc.db"

def migrate_database():
    """Add new columns for Verifily features"""

    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        print("   The database will be created automatically when you start the server.")
        return

    print(f"🔄 Migrating database: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if migrations already applied
        cursor.execute("PRAGMA table_info(verifications)")
        columns = [col[1] for col in cursor.fetchall()]

        migrations_needed = []

        if 'verified_by_author' not in columns:
            migrations_needed.append("verified_by_author")
        if 'author_username' not in columns:
            migrations_needed.append("author_username")
        if 'verification_type' not in columns:
            migrations_needed.append("verification_type")

        if not migrations_needed:
            print("✅ Database is already up to date!")
            return

        print(f"📝 Adding {len(migrations_needed)} new columns...")

        # Add new columns to verifications table
        if 'verified_by_author' in migrations_needed:
            cursor.execute("""
                ALTER TABLE verifications
                ADD COLUMN verified_by_author BOOLEAN NOT NULL DEFAULT 0
            """)
            print("  ✓ Added 'verified_by_author' column")

        if 'author_username' in migrations_needed:
            cursor.execute("""
                ALTER TABLE verifications
                ADD COLUMN author_username VARCHAR(100)
            """)
            print("  ✓ Added 'author_username' column")

        if 'verification_type' in migrations_needed:
            cursor.execute("""
                ALTER TABLE verifications
                ADD COLUMN verification_type VARCHAR(20)
            """)
            print("  ✓ Added 'verification_type' column")

        # Create waitlist table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS waitlist (
                id VARCHAR(36) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                source VARCHAR(50),
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  ✓ Created 'waitlist' table (if not exists)")

        # Create index on email for fast lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_waitlist_email
            ON waitlist(email)
        """)
        print("  ✓ Created index on waitlist.email")

        # Create index on created_at for sorting
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_waitlist_created_at
            ON waitlist(created_at)
        """)
        print("  ✓ Created index on waitlist.created_at")

        conn.commit()
        print("\n✅ Migration completed successfully!")
        print(f"   Database: {DB_PATH}")
        print(f"   New columns: {', '.join(migrations_needed)}")
        print("   New table: waitlist")
        print("\n🚀 You can now restart the backend server.")

    except sqlite3.Error as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise

    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
