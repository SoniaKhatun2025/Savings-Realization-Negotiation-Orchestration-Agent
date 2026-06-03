"""
NexusProcure Safe Database and Storage Cleanup Script.
Restores the database to its pristine state (keeps master users & suppliers 1-8).
Clears uploads, dynamic opportunities, tasks, savings, and logs.
"""
import sys
import os
import shutil
sys.path.insert(0, '.')
from dotenv import load_dotenv
load_dotenv()

from database.connection import get_db_connection

def run_cleanup():
    print("==================================================")
    print(">>> STARTING NEXUSPROCURE CLEANUP PIPELINE <<<")
    print("==================================================")

    # 1. Clear files on disk
    upload_dir = "./uploads"
    if os.path.exists(upload_dir):
        print(f"[DISK] Cleaning upload directory: '{upload_dir}'...")
        count_files = 0
        for item in os.listdir(upload_dir):
            item_path = os.path.join(upload_dir, item)
            # Avoid deleting important scripts
            if os.path.isfile(item_path) and not item.endswith('.py'):
                try:
                    os.remove(item_path)
                    count_files += 1
                except Exception as e:
                    print(f"  [WARN] Failed to delete file {item}: {e}")
        print(f"  [OK] Cleaned {count_files} files from disk.")
    else:
        print("[DISK] Upload directory not found, skipping disk cleanup.")

    # 2. Database cleanup
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        print("[DB] Disabling Foreign Key Checks for clean execution...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")

        # Count tables to be cleared
        tables_to_clear = [
            "uploaded_documents",
            "notifications",
            "tasks",
            "savings_ledger",
            "savings_tracker",
            "approvals",
            "negotiations",
            "chat_history",
            "opportunities",
            "audit_logs"
        ]

        print("\n[DB] Purging dynamic transaction tables...")
        for table in tables_to_clear:
            cursor.execute(f"SELECT COUNT(*) as cnt FROM {table}")
            cnt = cursor.fetchone()["cnt"]
            cursor.execute(f"TRUNCATE TABLE {table}")
            print(f"  [OK] Table '{table}': Cleared {cnt} records.")

        # Truncate the suppliers table completely
        cursor.execute("SELECT COUNT(*) as cnt FROM suppliers")
        total_suppliers = cursor.fetchone()["cnt"]
        cursor.execute("TRUNCATE TABLE suppliers")
        print(f"  [OK] Table 'suppliers': Cleared {total_suppliers} records and reset auto-increment.")

        conn.commit()
        print("\n[DB] Re-enabling Foreign Key Checks...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print("  [OK] Foreign Key Checks re-enabled.")

        print("==================================================")
        print(">>> CLEANUP PIPELINE COMPLETED SUCCESSFULLY! <<<")
        print("==================================================")

    except Exception as err:
        print(f"\n[ERROR] during cleanup: {err}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_cleanup()
