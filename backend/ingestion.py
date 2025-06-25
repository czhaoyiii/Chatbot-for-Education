# Import Basics
import os
from time import time
from pathlib import Path
from dotenv import load_dotenv

# Import Docling (Text extraction from unstructured)
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption

# Import langchain (Orchestrator)
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Import Gemini (Embedding)
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Import Supabase (Vector Database)
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Start time
start = time()

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Path to your documents folder
documents_dir = Path("temp_docs")
pdf_files = list(documents_dir.glob("*.pdf"))

# Initialize Docling converter
pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = True
pipeline_options.do_table_structure = True
pipeline_options.table_structure_options.do_cell_matching = True
pipeline_options.ocr_options = RapidOcrOptions(force_full_page_ocr=True)
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)

# Initialize LangChain chunker
text_splitter = RecursiveCharacterTextSplitter(chunk_size=690, chunk_overlap=100)

# Initialize Gemini embedding model
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-exp-03-07")

def pdf_upload():
    try:
        all_chunks = []
        for pdf in pdf_files:
            result = converter.convert(str(pdf))
            text = result.document.export_to_markdown()
            chunks = text_splitter.create_documents([text])
            total_chunks = len(chunks)
            for idx, chunk in enumerate(chunks):
                embedding = embeddings.embed_query(chunk.page_content)
                all_chunks.append({
                    "filename": pdf.name,
                    "content": chunk.page_content,
                    "embedding": embedding,
                    "metadata": {
                        "source": str(pdf),
                        "chunk_index": idx,
                        "total_chunks": total_chunks
                    }
                })
        for chunk in all_chunks:
            supabase.table("ingested_documents").insert(chunk).execute()

        # End time
        end = time()
        print(f"Ingested {len(all_chunks)} chunks from {len(pdf_files)} PDFs. Time taken: {end - start:.3f}")
        return f"Ingested {len(all_chunks)} chunks from {len(pdf_files)} PDFs. Time taken: {end - start:.3f}"
    except Exception as e:
        print("An exception occured:", e)