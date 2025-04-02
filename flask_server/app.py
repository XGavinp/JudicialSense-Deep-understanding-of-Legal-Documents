import os
import re
import logging
import torch
import pdfplumber
import spacy
import pytesseract
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from langdetect import detect, LangDetectException
from typing import List, Optional
# ======================
# Configuration
# ======================
class Config:
    """
    Configuration class holds application-wide settings.
    """
    ALLOWED_EXTENSIONS = {'pdf', 'txt'}
    MAX_FILE_SIZE_MB = 15
    MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
    HOST = '0.0.0.0'
    PORT = 5000

    SUMMARIZER_MODEL = "facebook/bart-large-cnn"
    QA_EXTRACTIVE_MODEL = "deepset/roberta-large-squad2"
    QA_GENERATIVE_MODEL = "google/flan-t5-large"
    LEGAL_CLASSIFIER_MODEL = "nlpaueb/legal-bert-base-uncased"
    ZERO_SHOT_MODEL = "facebook/bart-large-mnli"
    SENTIMENT_MODEL = "cardiffnlp/twitter-roberta-base-sentiment"

    MIN_QUESTION_LENGTH = 5
    QA_CONFIDENCE_THRESHOLD = 0.2
    SUMMARIZER_MAX_TOKENS = 512
    QA_MAX_TOKENS = 256
    GENERATIVE_QA_MAX_CONTEXT = 512

    LEGAL_KEYWORDS = {
        "agreement", "contract", "party", "legal", "terms",
        "conditions", "obligation", "liability", "warranty", "indemnity"
    }
    TOP_SENTENCES = 3

# ======================
# Logging and Initialization
# ======================
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load spaCy model for text processing and NLP
try:
    nlp = spacy.load("en_core_web_md")
except Exception as e:
    logger.critical(f"Failed to load spaCy model: {e}")
    exit(1)

# Initialize Flask application and enable CORS support
app = Flask(__name__)
CORS(app)

# Determine device for model inference (GPU if available)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# ======================
# Load Pretrained Models
# ======================
try:
    summarizer = pipeline(
        "summarization",
        model=Config.SUMMARIZER_MODEL,
        device=0 if torch.cuda.is_available() else -1
    )
    qa_extractive = pipeline(
        "question-answering",
        model=Config.QA_EXTRACTIVE_MODEL,
        device=0 if torch.cuda.is_available() else -1
    )
    qa_generative = pipeline(
        "text2text-generation",
        model=Config.QA_GENERATIVE_MODEL,
        device=0 if torch.cuda.is_available() else -1
    )
    legal_tokenizer = AutoTokenizer.from_pretrained(Config.LEGAL_CLASSIFIER_MODEL, use_fast=False)
    legal_classifier_model = AutoModelForSequenceClassification.from_pretrained(Config.LEGAL_CLASSIFIER_MODEL)
    legal_classifier = pipeline(
        "text-classification",
        model=legal_classifier_model,
        tokenizer=legal_tokenizer,
        device=0 if torch.cuda.is_available() else -1
    )
    zero_shot_classifier = pipeline(
        "zero-shot-classification",
        model=Config.ZERO_SHOT_MODEL,
        device=0 if torch.cuda.is_available() else -1
    )
    sentiment_pipeline = pipeline(
        "sentiment-analysis",
        model=Config.SENTIMENT_MODEL,
        tokenizer=Config.SENTIMENT_MODEL,
        device=0 if torch.cuda.is_available() else -1
    )
except Exception as e:
    logger.critical(f"Model initialization failed: {e}")
    exit(1)

# ======================
# Helper Functions
# ======================
def validate_file(file) -> Optional[str]:
    """
    Validate file presence, extension, and size.
    Returns error message if invalid; otherwise None.
    """
    if not file or file.filename == '':
        return "No file selected"
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if ext not in Config.ALLOWED_EXTENSIONS:
        return "Invalid file type"
    file.seek(0, os.SEEK_END)
    if file.tell() > Config.MAX_FILE_BYTES:
        return f"File exceeds {Config.MAX_FILE_SIZE_MB}MB limit"
    file.seek(0)
    return None

def basic_clean(text: str) -> str:
    """
    Perform basic text cleaning: collapse whitespace and trim.
    """
    return re.sub(r'\s+', ' ', text).strip()

# ======================
# Text Extraction with OCR Fallback
# ======================
def extract_text(file) -> str:
    """
    Extract text from PDF or text files. Applies OCR for scanned PDFs.
    """
    try:
        if file.filename.lower().endswith('.pdf'):
            return extract_pdf_text(file)
        return basic_clean(file.read().decode('utf-8'))
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        return ""

def extract_pdf_text(file) -> str:
    """
    Extract text from each PDF page; fallback to OCR if text extraction fails.
    """
    text_parts = []
    try:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if not page_text or page_text.strip() == "":
                    logger.info("No text extracted from page; applying OCR.")
                    page_image = page.to_image(resolution=300).original.convert("RGB")
                    page_text = pytesseract.image_to_string(page_image)
                text_parts.append(page_text)
        return " ".join(text_parts)
    except Exception as e:
        logger.error(f"PDF processing failed: {e}")
        return ""

# ======================
# Legal Document Classification
# ======================
def is_legal_document(text: str) -> bool:
    """
    Determine if a document is legal using a classifier,
    fallback heuristics, and zero-shot classification.
    """
    try:
        if detect(text) != 'en':
            return False
    except LangDetectException:
        return False

    truncated = text[:1024]
    try:
        result = legal_classifier(truncated)[0]
        if result["score"] >= 0.90:
            return True
    except Exception as e:
        logger.error(f"Legal classifier error: {e}")

    doc = nlp(text)
    legal_entities = [ent.text.lower() for ent in doc.ents if ent.label_ in {"LAW", "ORG", "GPE", "DATE", "MONEY"}]
    keyword_count = sum(text.lower().count(word) for word in Config.LEGAL_KEYWORDS)
    if len(set(legal_entities)) >= 4 and keyword_count >= 7:
        return True

    candidate_labels = ["Legal Document", "Non-Legal Document"]
    try:
        zero_shot_result = zero_shot_classifier(truncated, candidate_labels=candidate_labels)
        predicted = zero_shot_result["labels"][0]
        logger.info(f"Zero-shot classifier predicted: {predicted}")
        return predicted == "Legal Document"
    except Exception as e:
        logger.error(f"Zero-shot classification error: {e}")
        return False

# ======================
# Summarization Functions
# ======================
def split_into_sections(text: str, tokenizer, max_tokens: int) -> List[str]:
    """
    Split text into sections based on sentence boundaries such that each section's
    token length is below the maximum allowed.
    """
    doc = nlp(text)
    sentences = [sent.text for sent in doc.sents]
    sections = []
    current_section = []
    current_length = 0
    for sentence in sentences:
        sentence_length = len(tokenizer.encode(sentence, add_special_tokens=False))
        if current_length + sentence_length > max_tokens and current_section:
            sections.append(" ".join(current_section))
            current_section = [sentence]
            current_length = sentence_length
        else:
            current_section.append(sentence)
            current_length += sentence_length
    if current_section:
        sections.append(" ".join(current_section))
    return sections

def summarize_document(text: str) -> str:
    """
    Generate a summary for the provided text. Adjust max_length and min_length dynamically
    based on the input token count. If the text is short, produce a correspondingly short summary.
    """
    tokens = summarizer.tokenizer.encode(text, add_special_tokens=True)
    token_count = len(tokens)
    if token_count < 100:
        max_len = 21
        min_len = 10
    else:
        max_len = 250
        min_len = 100

    if token_count <= Config.SUMMARIZER_MAX_TOKENS:
        return summarizer(text, max_length=max_len, min_length=min_len, truncation=True)[0]['summary_text']
    else:
        sections = split_into_sections(text, summarizer.tokenizer, Config.SUMMARIZER_MAX_TOKENS)
        section_summaries = []
        for sec in sections:
            try:
                sec_summary = summarizer(sec, max_length=max_len, min_length=min_len, truncation=True)[0]['summary_text']
                section_summaries.append(sec_summary)
            except Exception as e:
                logger.warning(f"Summarization error for section: {e}")
        combined = " ".join(section_summaries)
        tokens_combined = summarizer.tokenizer.encode(combined, add_special_tokens=True)
        if len(tokens_combined) > Config.SUMMARIZER_MAX_TOKENS:
            return summarizer(combined, max_length=max_len, min_length=min_len, truncation=True)[0]['summary_text']
        else:
            return combined

# ======================
# Question Answering Functions
# ======================
def extractive_qa(text: str, question: str) -> Optional[str]:
    """
    Perform extractive question answering. If the context is too long,
    split it into sections and select the best answer based on confidence.
    """
    encoding = qa_extractive.tokenizer.encode(text, add_special_tokens=True)
    if len(encoding) <= Config.QA_MAX_TOKENS:
        result = qa_extractive(question=question, context=text, max_answer_len=150)
        if isinstance(result, list):
            if len(result) == 0:
                return None
            result = result[0]
        return result["answer"].strip() if result["score"] >= Config.QA_CONFIDENCE_THRESHOLD else None
    else:
        sections = split_into_sections(text, qa_extractive.tokenizer, Config.QA_MAX_TOKENS)
        best_answer, best_score = None, 0.0
        for sec in sections:
            try:
                result = qa_extractive(question=question, context=sec, max_answer_len=150)
                if isinstance(result, list):
                    if len(result) == 0:
                        continue
                    result = result[0]
                if result["score"] > best_score:
                    best_score = result["score"]
                    best_answer = result["answer"].strip()
            except Exception as e:
                logger.warning(f"Extractive QA error in section: {e}")
        return best_answer if best_score >= Config.QA_CONFIDENCE_THRESHOLD else None

def generative_qa(text: str, question: str) -> str:
    """
    Perform generative question answering using only the content from the PDF.
    If the context is too long, summarize the document first.
    
    The prompt instructs the model to:
      - Use only the provided document content.
      - Provide a detailed answer that directly addresses the question.
      - Return 'unanswerable' if the document does not contain enough information to answer.
    """
    gen_tokenizer = qa_generative.tokenizer
    encoding = gen_tokenizer.encode(text, add_special_tokens=True)
    if len(encoding) > Config.GENERATIVE_QA_MAX_CONTEXT:
        context = summarize_document(text)
    else:
        context = text

    prompt = (
        "You are provided with a document and a question. Your task is to answer the question based solely on "
        "the information in the document. Provide a detailed, specific answer. Do not simply repeat sentences unless they "
        "fully answer the question. If the document does not provide enough information or if the question is not addressed, "
        "respond with 'unanswerable'.\n\n"
        f"Document:\n{context}\n\n"
        f"Question: {question}\n"
        "Detailed Answer:"
    )
    
    result = qa_generative(prompt, max_length=150)
    return result[0]["generated_text"].strip()



def get_qa_answer(text: str, question: str) -> str:
    """
    Get an answer to the given question using extractive QA, and fallback
    to generative QA if necessary.
    """
    answer = extractive_qa(text, question)
    if not answer or answer.lower() in ["", "answer not found"]:
        logger.info("Extractive QA failed; using generative QA fallback.")
        answer = generative_qa(text, question)
    return answer if answer else "Answer not found"

# ======================
# Sentiment Analysis Function
# ======================
def get_sentiment(text: str) -> dict:
    """
    Analyze sentiment of the given text and map model labels to common sentiment values.
    """
    result = sentiment_pipeline(text)
    mapping = {
        "LABEL_0": "Negative",
        "LABEL_1": "Neutral",
        "LABEL_2": "Positive"
    }
    label = result[0].get("label", "LABEL_1")
    sentiment = mapping.get(label, label)
    return {"label": sentiment, "score": result[0].get("score", 0)}

# ======================
# API Endpoints
# ======================
@app.route("/classify", methods=["POST"])
def classify_document():
    """
    Endpoint to classify a document as Legal or Non-Legal.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    text = extract_text(file)
    classification = "Legal Document" if is_legal_document(text) else "Non-Legal Document"
    return jsonify({"classification": classification})

@app.route("/summarize", methods=["POST"])
def summarize_endpoint():
    """
    Endpoint to summarize a legal document.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    if (error := validate_file(file)):
        return jsonify({"error": error}), 400
    text = extract_text(file)
    if not text or not is_legal_document(text):
        return jsonify({"error": "Invalid or non-legal document"}), 400
    summary = summarize_document(text)
    sentiment = get_sentiment(summary)
    return jsonify({"summary": summary, "sentiment": sentiment})

@app.route("/contracts", methods=["POST"])
def contract_qa():
    """
    Endpoint to perform question answering on a legal document.
    """
    if 'file' not in request.files or 'question' not in request.form:
        return jsonify({"error": "Missing parameters"}), 400
    file = request.files['file']
    question = request.form['question'].strip()
    if (error := validate_file(file)) or len(question) < Config.MIN_QUESTION_LENGTH:
        return jsonify({"error": error or "Question too short"}), 400
    text = extract_text(file)
    if not text or not is_legal_document(text):
        return jsonify({"error": "Invalid or non-legal document"}), 400
    answer = get_qa_answer(text, question)
    sentiment = get_sentiment(answer)
    return jsonify({"answer": answer, "sentiment": sentiment})

@app.route("/sentiment", methods=["POST"])
def sentiment_endpoint():
    """
    Endpoint to analyze sentiment of provided text.
    """
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    text = data["text"]
    sentiment = get_sentiment(text)
    return jsonify({"sentiment": sentiment})

# ======================
# Application Execution
# ======================
if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, threaded=True)
