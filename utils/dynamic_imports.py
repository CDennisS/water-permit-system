"""
Dynamic import system for heavy dependencies
Only loads libraries when actually needed
"""
import importlib
import sys
from functools import wraps

class DynamicImporter:
    """Manages dynamic imports for heavy libraries"""
    
    def __init__(self):
        self._cache = {}
    
    def get_pandas(self):
        """Import pandas only when needed"""
        if 'pandas' not in self._cache:
            try:
                self._cache['pandas'] = importlib.import_module('pandas')
            except ImportError:
                raise ImportError("pandas required for this operation. Install with: pip install pandas")
        return self._cache['pandas']
    
    def get_xlsxwriter(self):
        """Import xlsxwriter only when needed"""
        if 'xlsxwriter' not in self._cache:
            try:
                self._cache['xlsxwriter'] = importlib.import_module('xlsxwriter')
            except ImportError:
                raise ImportError("xlsxwriter required for Excel export. Install with: pip install xlsxwriter")
        return self._cache['xlsxwriter']
    
    def get_reportlab(self):
        """Import reportlab only when needed"""
        if 'reportlab' not in self._cache:
            try:
                canvas = importlib.import_module('reportlab.pdfgen.canvas')
                pagesizes = importlib.import_module('reportlab.lib.pagesizes')
                self._cache['reportlab'] = {'canvas': canvas, 'pagesizes': pagesizes}
            except ImportError:
                raise ImportError("reportlab required for PDF generation. Install with: pip install reportlab")
        return self._cache['reportlab']
    
    def get_pymupdf(self):
        """Import PyMuPDF only when needed"""
        if 'fitz' not in self._cache:
            try:
                self._cache['fitz'] = importlib.import_module('fitz')
            except ImportError:
                raise ImportError("PyMuPDF required for PDF processing. Install with: pip install PyMuPDF")
        return self._cache['fitz']
    
    def get_pillow(self):
        """Import Pillow only when needed"""
        if 'PIL' not in self._cache:
            try:
                Image = importlib.import_module('PIL.Image')
                self._cache['PIL'] = {'Image': Image}
            except ImportError:
                raise ImportError("Pillow required for image processing. Install with: pip install Pillow")
        return self._cache['PIL']

# Global importer instance
importer = DynamicImporter()

def requires_pandas(f):
    """Decorator to ensure pandas is available"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        importer.get_pandas()
        return f(*args, **kwargs)
    return decorated_function

def requires_excel(f):
    """Decorator to ensure Excel libraries are available"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        importer.get_pandas()
        importer.get_xlsxwriter()
        return f(*args, **kwargs)
    return decorated_function

def requires_pdf(f):
    """Decorator to ensure PDF libraries are available"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        importer.get_reportlab()
        return f(*args, **kwargs)
    return decorated_function
