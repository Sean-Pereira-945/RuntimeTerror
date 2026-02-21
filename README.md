# Federated Review Analyzer (Judge Demo)

This project demonstrates a privacy-preserving federated learning system that acts as an Amazon/Google-style product review analyzer. It enables heterogenous client stores (e.g., Phone, Clothing, Food) to collaboratively train an **LSTM Sentiment Classifier** without sharing raw customer data.

The project features a full **Streamlit Web App** to visualize training and run interactive live inferences on the resulting global model.

It is being developed iteratively using the GSD (Get Shit Done) methodology.

## Current State

We have completed the core milestones:
- Implemented `ReviewLSTM` (Embedding → LSTM → Binary Classification).
- Built a synthetic NLP data generator for heterogeneous retail stores.
- Integrated **Flower (flwr==1.0.0)** for asynchronous federated orchestration (random 2-5 local epochs per client via FedAvg).
- Built an interactive **Streamlit UI** for live training visualization and judge demo predictions.

## Project Structure

- `app.py`: The main Streamlit Judge Demo application.
- `src/nlp_model.py`: Defines the PyTorch LSTM neural network model.
- `src/nlp_data.py`: Handles synthetic review generation and text tokenization.
- `src/nlp_client.py`: The Flower federated client logic simulating asynchronous/variable computing.
- `src/main.py`: The threaded local orchestration tying the server and clients together.
- `.gsd/`: Contains project documentation, plans, state, and research according to the GSD methodology.

## Installation

1. Create a Python environment.
2. Install the necessary dependencies:

```bash
pip install -r requirements.txt
```

## Usage

To launch the interactive Judge Demo:

```bash
streamlit run app.py
```

1. Click **START TRAINING** to initiate the background asynchronous FL simulation.
2. Wait for the `global_model.pth` to be successfully generated.
3. Use the **Live Inference** text box to type mock reviews (e.g., *"hate this phone"*) and get instant Positive/Negative sentiment predictions!
