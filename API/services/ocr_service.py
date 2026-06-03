import os
import logging
import pdfplumber
import pypdfium2 as pdfium
import pytesseract

logger = logging.getLogger(__name__)

# Configure pytesseract command path from environment if provided
tesseract_path = os.getenv("TESSERACT_PATH")
if tesseract_path:
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

def is_tesseract_available() -> bool:
    """
    Checks if Tesseract is installed and accessible.
    """
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False

def extract_pages_from_pdf(file_path: str) -> list[str]:
    """
    Returns a list of page contents. If overall text is empty, uses OCR for all pages.
    """
    pages_text = []
    
    # Try normal extraction page-by-page
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                pages_text.append(text if text else "")
    except Exception as e:
        logger.warning(f"Normal text extraction failed: {e}")
        
    # Check if we got substantial text
    total_len = sum(len(p) for p in pages_text)
    
    if total_len < 50:
        logger.info("Normal text extraction yielded too little text. Attempting OCR page-by-page...")
        if not is_tesseract_available():
            msg = (
                "OCR required for scanned PDF but Tesseract-OCR is not installed or configured. "
                "Please install Tesseract-OCR and configure TESSERACT_PATH in your .env file."
            )
            logger.error(msg)
            raise RuntimeError(msg)
            
        pages_text = []
        try:
            doc = pdfium.PdfDocument(file_path)
            for i, page in enumerate(doc):
                bitmap = page.render(scale=2)
                pil_img = bitmap.to_pil()
                text = pytesseract.image_to_string(pil_img)
                pages_text.append(text if text else "")
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            raise e
            
    return pages_text
