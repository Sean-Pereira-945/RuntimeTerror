import os
import pandas as pd
from src.database import save_client_dataset

def sync_uploads():
    upload_dir = os.path.join(os.getcwd(), "data", "uploads")
    if not os.path.isdir(upload_dir):
        print(f"No upload dir: {upload_dir}")
        return
    
    for fname in os.listdir(upload_dir):
        if fname.endswith(".csv"):
            cid = fname.replace(".csv", "")
            fpath = os.path.join(upload_dir, fname)
            print(f"Syncing {fname} (ID: {cid})...")
            try:
                df = pd.read_csv(fpath)
                save_client_dataset(cid, df)
                print(f"Successfully synced {cid}")
            except Exception as e:
                print(f"Failed to sync {cid}: {e}")

if __name__ == "__main__":
    sync_uploads()
