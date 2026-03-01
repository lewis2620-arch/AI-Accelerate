import streamlit as st

st.set_page_config(page_title="AI Accelerate PM Playground", page_icon="🚀")
st.title("🚀 AI Accelerate PM Playground")
st.markdown("**Test skills, frameworks, and agents right here.** Built for PMs who vibe-code in the agentic era.")

tab1, tab2, tab3, tab4 = st.tabs(["Frameworks", "Skills", "Agents", "Portfolio"])

with tab1:
    st.header("Product Edge Frameworks")
    st.write("- **EDGE** – Outcome-driven ops")
    st.write("- **PRISM** – Responsible agentic AI")
    st.write("- **PLG** – Growth loops")
    st.write("- **FITR** – Competitive infiltration")
    st.write("- **Agentic Infrastructure** – 5-layer vision")

with tab2:
    st.header("MCP-Ready Skills")
    st.write("Load `mcp/context.md` into Claude Code/Cursor for instant access to all 60+ skills.")

with tab3:
    st.header("Runnable Agents")
    st.page_link("agents/vibe-to-ship-orchestrator/README.md", label="Vibe-to-Ship Orchestrator", icon="⚡")
    st.write("More agents coming in next batches...")

with tab4:
    st.header("Shipped Portfolio")
    st.page_link("portfolio-stack/README.md", label="View Full Stack", icon="📂")

st.caption("Run locally: `pip install streamlit` then `streamlit run playground/app.py`")
