---
phase: 3
plan: 3
wave: 3
---

# Plan 3.3: Streamlit Interface and Judge Demo

## Objective
Build the interactive Amazon/Google-style product review Streamlit app to launch the FL simulation and provide live predictions for the Judge.

## Context
- app.py (to be created)
- requirements.txt
- .gsd/phases/3/RESEARCH.md

## Tasks

<task type="auto">
  <name>Add Streamlit Dependencies</name>
  <files>
    - requirements.txt
  </files>
  <action>
    - Add `streamlit` to `requirements.txt`.
  </action>
  <verify>Run `pip install -r requirements.txt`.</verify>
  <done>Streamlit is installed.</done>
</task>

<task type="auto">
  <name>Build Judge Demo App</name>
  <files>
    - app.py
  </files>
  <action>
    - Create a Streamlit UI with a title "Federated Review Analyzer".
    - Add a `st.button("START TRAINING")`. When clicked, it should spawn a `threading.Thread` that runs the FL simulation from `src/main.py`.
    - Provide a `st.text_input` or `st.text_area` for the Judge to type a review (e.g., "hate this phone").
    - Provide a 'Predict' button that loads `global_model.pth` (if it exists), tokenizes the text, runs the LSTM, and displays the `Positive` or `Negative` result with a confidence percentage.
    - (Optional but requested) Use `st.empty()` or a similar container to show live training metrics if the simulation writes them to a shared file.
  </action>
  <verify>Run `streamlit run app.py` (or verify the file parses correctly). Confirm the UI renders the required buttons.</verify>
  <done>An interactive UI allows triggering the FL process and performs live demo inferences.</done>
</task>

## Success Criteria
- [ ] Streamlit app integrates the FL backend.
- [ ] UI allows inputting a review and yields a Positive/Negative prediction.
- [ ] Typing "hate this phone" correctly evaluates to Negative.
