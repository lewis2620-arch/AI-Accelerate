from langchain_openai import ChatOpenAI
from langchain.document_loaders import PyPDFLoader
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

prompt = PromptTemplate(
    input_variables=["doc_text"],
    template="""Extract key insights from this document and classify risk level.
    Apply PRISM guardrails: flag any HIPAA/PII concerns.
    Document: {doc_text}"""
)

chain = LLMChain(llm=llm, prompt=prompt)

doc_text = "Sample clinical note text here..."  # Replace with real upload in full version
result = chain.run(doc_text)
print(result)
