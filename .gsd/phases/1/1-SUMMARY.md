# Plan 1.1 Summary

## Tasks Completed
1. **Initialize Project and Dependencies**: Created `requirements.txt` with `torch`, `torchvision`, `numpy`, and `tqdm`. Created `.gitignore`. Verified dependencies by running `pip install -r requirements.txt`.
2. **Model and Data Utilities**: 
   - Created `src/model.py` containing a simple `SimpleCNN` for MNIST.
   - Created `src/data.py` containing a `get_dataset` function to download MNIST, and a `partition_data` function that uses a Dirichlet distribution (`numpy.random.dirichlet`) to split the dataset in a non-IID fashion among clients.
   - Executed `python src/data.py` which downloaded MNIST and confirmed the heterogeneous distribution of labels across clients.

## Status
All tasks for Plan 1.1 are COMPLETE and VERIFIED.
