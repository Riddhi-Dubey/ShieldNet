import os
import sys
import argparse

# Add project root to sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.database.database import SessionLocal
from backend.app.services.dataset_import import process_dataset_csv


def main():
    parser = argparse.ArgumentParser(description="ScamTrace Dataset Importer CLI")
    parser.add_argument("--file", "-f", required=True, help="Path to CSV dataset file")
    parser.add_argument("--name", "-n", required=True, help="Dataset name (e.g. PaySim, PhishTank, Elliptic)")
    parser.add_argument("--limit", "-l", type=int, default=5000, help="Maximum rows to process")

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found at '{args.file}'")
        sys.exit(1)

    print(f"Reading dataset '{args.name}' from {args.file} (limit: {args.limit} rows)...")
    with open(args.file, "rb") as f:
        file_bytes = f.read()

    db = SessionLocal()
    try:
        summary = process_dataset_csv(
            db=db,
            file_bytes=file_bytes,
            dataset_name=args.name,
            max_rows=args.limit
        )
        print("Import Complete!")
        print(f"  Status: {summary.import_status}")
        print(f"  Processed rows: {summary.processed_rows}")
        print(f"  Imported entities: {summary.imported_entities}")
        print(f"  Imported relationships: {summary.imported_relationships}")
        print(f"  Duplicates detected: {summary.duplicate_rows}")
        print(f"  Rejected rows: {summary.rejected_rows}")
        if summary.warnings:
            print(f"  Warnings: {len(summary.warnings)}")
            for w in summary.warnings[:5]:
                print(f"    - {w}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
