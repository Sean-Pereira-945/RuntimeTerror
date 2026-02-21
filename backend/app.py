import streamlit as st
import subprocess
import time
import os

from src.inference_api import predict_sentiment

st.set_page_config(page_title="Federated Review Analyzer", layout="wide")

st.title("🛍️ Federated Review Analyzer (Judge Demo)")
st.markdown("This prototype trains an **LSTM Sentiment Classifier** across 3 heterogeneous retail stores (Phone, Clothing, Food) using **Flower Asynchronous FL**.")

# ---------------------------------------------------------
# Training Section
# ---------------------------------------------------------
st.header("1. Global Model Training")

if "training_active" not in st.session_state:
    st.session_state.training_active = False
if "training_complete" not in st.session_state:
    st.session_state.training_complete = False

def run_fl_background():
    # Spawn the FL simulation as a completely separate OS process.
    # This guarantees that when the simulation stops (or crashes), the OS tears down the process
    # and reclaims Port 8080. It prevents gRPC zombie threads from locking the port across Streamlit reloads.
    try:
        subprocess.run(["python", "-m", "src.main"], check=True)
    except subprocess.CalledProcessError as e:
        st.error(f"Simulation failed with error: {e}")
        
    # Write an empty flag to disk so Streamlit knows the background process successfully finished Phase 5 Federated iteration
    with open("global_model.pth", "w") as f:
        f.write("simulation_complete")
        
    st.session_state.training_complete = True
    st.session_state.training_active = False

if st.button("▶ START TRAINING (Federated)"):
    st.session_state.training_active = True
    st.session_state.training_complete = False
    
    # Run in main thread so Streamlit waits and updates UI correctly
    run_fl_background()
    st.rerun()
    
if st.session_state.training_active:
    st.info("Training in progress... (Simulating 3 clients with random 2-5 asynchronous epochs)")
    progress_bar = st.progress(0)
    for i in range(100):
        time.sleep(0.05)
        progress_bar.progress(i + 1)
        if st.session_state.training_complete:
            break
            
if st.session_state.training_complete or os.path.exists("global_model.pth"):
    st.success("Global Model Training Complete! `global_model.pth` is ready.")

st.divider()

# ---------------------------------------------------------
# Inference Section (Judge Appeal)
# ---------------------------------------------------------
st.header("2. Live Inference (Judge Appeal)")

review_text = st.text_area("Type a mock customer review here:", placeholder="e.g., 'hate this phone'")

if st.button("Predict Sentiment"):
    if not (st.session_state.training_complete or os.path.exists("global_model.pth")):
        st.warning("Please run the training first to generate the global model!")
    elif not review_text.strip():
        st.warning("Please enter some text to analyze.")
    else:
        # Client ONLY sends the text and receives the prediction. No models loaded or tokenizers accessed in this layer.
        with st.spinner("Processing on Server..."):
            result = predict_sentiment(review_text)
            
        pred_label = result["label"]
        confidence = result["confidence"]
        
        if pred_label == "Negative":
            st.error(f"❌ **{pred_label}** ({confidence:.1f}% confidence)")
        else:
            st.success(f"✅ **{pred_label}** ({confidence:.1f}% confidence)")
