import streamlit as st
import subprocess
import time
import os

from src.inference_api import predict_sentiment

# Resolve paths relative to this file (backend/)
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
GLOBAL_MODEL_PATH = os.path.join(BACKEND_DIR, "global_model.pth")

st.set_page_config(page_title="Federated Review Analyzer", layout="wide")

st.title("🛍️ Federated Review Analyzer (Judge Demo)")
st.markdown("This prototype trains a **DistilBERT Sentiment Classifier** across 3 heterogeneous retail stores (Phone, Clothing, Food) using **Flower Federated Learning**.")

# ---------------------------------------------------------
# Training Section
# ---------------------------------------------------------
st.header("1. Global Model Training")

if "training_active" not in st.session_state:
    st.session_state.training_active = False
if "training_complete" not in st.session_state:
    st.session_state.training_complete = False
if "training_process" not in st.session_state:
    st.session_state.training_process = None

if st.button("▶ START TRAINING (Federated)"):
    st.session_state.training_active = True
    st.session_state.training_complete = False
    # Launch FL simulation as a non-blocking subprocess
    proc = subprocess.Popen(
        ["python", "-m", "src.main"],
        cwd=BACKEND_DIR,
    )
    st.session_state.training_process = proc
    st.rerun()
    
if st.session_state.training_active:
    proc = st.session_state.training_process
    if proc is not None and proc.poll() is not None:
        # Process finished
        st.session_state.training_complete = True
        st.session_state.training_active = False
        st.session_state.training_process = None
        st.rerun()
    else:
        st.info("Training in progress... (10 FL rounds with 3 clients, random 2-5 local epochs each)")
        progress_bar = st.progress(0)
        for i in range(100):
            time.sleep(0.3)
            progress_bar.progress(min(i + 1, 99))
            if proc is not None and proc.poll() is not None:
                progress_bar.progress(100)
                break
            
if st.session_state.training_complete or os.path.exists(GLOBAL_MODEL_PATH):
    st.success("Global Model Training Complete! `global_model.pth` is ready.")

st.divider()

# ---------------------------------------------------------
# Inference Section (Judge Appeal)
# ---------------------------------------------------------
st.header("2. Live Inference (Judge Appeal)")

review_text = st.text_area("Type a mock customer review here:", placeholder="e.g., 'hate this phone'")

if st.button("Predict Sentiment"):
    if not (st.session_state.training_complete or os.path.exists(GLOBAL_MODEL_PATH)):
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
