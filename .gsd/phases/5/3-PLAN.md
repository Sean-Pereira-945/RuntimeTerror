---
phase: 5
plan: 3
wave: 3
---

# Plan 5.3: Server-Side Inference Architecture

## Objective
Refactor the Streamlit Judge Demo to cleanly decouple the heavy PyTorch model into a "Server-Side" API function, ensuring the Streamlit application acts purely as a "Client" passing data and rendering inference results.

## Context
- `src/inference_api.py` (to be created)
- `app.py`
- `.gsd/phases/5/RESEARCH.md`

## Tasks

<task type="auto">
  <name>Build Inference API Boundary</name>
  <files>
    - `src/inference_api.py`
  </files>
  <action>
    - Create a standalone module that represents the 'Server'.
    - Implement a `predict_sentiment(text)` function.
    - Inside this function, load the tokenization logic and load the finalized `global_model.pth` transformer weights.
    - Return a simple dictionary or tuple representation of the result (e.g., `{"label": "Negative", "confidence": 92.5}`).
  </action>
  <verify>Run `python src/inference_api.py` locally and assert it returns a valid JSON/dict when parsing "hate this phone".</verify>
  <done>Server-side inference is isolated to its own functional namespace.</done>
</task>

<task type="auto">
  <name>Adopt Client-Side Streamlit UX</name>
  <files>
    - `app.py`
  </files>
  <action>
    - Remove all direct references to `torch`, `ReviewLSTM`, `DistilBert`, and tokenizers from `app.py`.
    - When the user clicks "Predict Sentiment", `app.py` must simply call `predict_sentiment(review_text)` imported from `src.inference_api` and render the retrieved dictionary object.
  </action>
  <verify>Run `streamlit run app.py` and verify predictions still function exactly as before, but the application code is visually scrubbed of ML implementation details.</verify>
  <done>The Judge Demo strictly displays predictions returned from the server-side logic.</done>
</task>

## Success Criteria
- [ ] `app.py` acts purely as a Client view.
- [ ] Model weights and tokenization logic is restricted to `src/inference_api.py`.
- [ ] The system accurately predicts "hate this phone" as Negative.
