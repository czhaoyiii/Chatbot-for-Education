# Import Basics
import os
from time import time
from pathlib import Path
from dotenv import load_dotenv
from typing import Union, Dict, Optional

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

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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

def files_upload(
    documents_dir: Union[str, Path],
    *,
    course_id: Optional[str] = None,
    course_file_ids: Optional[Dict[str, str]] = None,
) -> str:
    start = time()
    try:
        documents_path = Path(documents_dir)
        
        # Get all supported file types
        supported_extensions = ['*.pdf', '*.doc', '*.docx', '*.ppt', '*.pptx', '*.txt']
        all_files = []
        
        for extension in supported_extensions:
            all_files.extend(list(documents_path.glob(extension)))
        
        if not all_files:
            return "No supported files found in the directory"
        
        all_chunks = []
        for file_path in all_files:
            result = converter.convert(str(file_path))
            text = result.document.export_to_markdown()
            chunks = text_splitter.create_documents([text])
            total_chunks = len(chunks)
            for idx, chunk in enumerate(chunks):
                embedding = embeddings.embed_query(chunk.page_content)
                all_chunks.append({
                    "filename": file_path.name,
                    "content": chunk.page_content,
                    "embedding": embedding,
                    "metadata": {
                        "source": str(file_path),
                        "chunk_index": idx,
                        "total_chunks": total_chunks
                    }
                })
        # Insert into ingested_documents with required fields
        for chunk in all_chunks:
            row = {
                "content": chunk["content"],
                "embedding": chunk["embedding"],
            }
            # Optionally include course linkage if provided
            if course_id:
                row["course_id"] = course_id
            if course_file_ids and chunk.get("filename") in course_file_ids:
                row["course_file_id"] = course_file_ids[chunk["filename"]]
            supabase.table("ingested_documents").insert(row).execute()

        # End time
        end = time()
        print(f"Ingested {len(all_chunks)} chunks from {len(all_files)} PDFs. Time taken: {end - start:.3f}")
        return f"Ingested {len(all_chunks)} chunks from {len(all_files)} PDFs. Time taken: {end - start:.3f}"
    
    except Exception as e:
        print("An exception occured:", e)


def pdf_upload():
    """
    Deprecated. Use files_upload() instead.
    """
    raise NotImplementedError("Use files_upload() with appropriate parameters.")