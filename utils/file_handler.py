import os
import hashlib
from datetime import datetime
from werkzeug.utils import secure_filename
from utils.dynamic_imports import importer

class FileHandler:
    """Handle file operations with dynamic imports"""
    
    def __init__(self):
        self.upload_folder = 'uploads'
        self.allowed_extensions = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
    
    def allowed_file(self, filename):
        """Check if file type is allowed"""
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def get_file_hash(self, file_path):
        """Generate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def process_image(self, file_path):
        """Process image files using dynamic import"""
        try:
            PIL = importer.get_pillow()
            Image = PIL['Image']
            
            with Image.open(file_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                # Resize if too large
                if max(img.size) > 2000:
                    ratio = 2000 / max(img.size)
                    new_size = tuple(int(dim * ratio) for dim in img.size)
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                # Save processed image
                img.save(file_path, 'JPEG', quality=85)
        except ImportError:
            # If Pillow not available, skip processing
            pass
    
    def process_pdf(self, file_path):
        """Process PDF files using dynamic import"""
        try:
            fitz = importer.get_pymupdf()
            
            doc = fitz.open(file_path)
            # Compress PDF if needed
            if doc.page_count > 0:
                for page in doc:
                    page.clean_contents()
                doc.save(file_path, garbage=4, deflate=True, clean=True)
            doc.close()
        except ImportError:
            # If PyMuPDF not available, skip processing
            pass
    
    def save_file(self, file, application_id, document_type):
        """Save and process uploaded file"""
        if not self.allowed_file(file.filename):
            raise ValueError('Invalid file type')
        
        # Create unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        original_filename = secure_filename(file.filename)
        file_ext = original_filename.rsplit('.', 1)[1].lower()
        filename = f"{application_id}_{timestamp}_{original_filename}"
        
        # Create application-specific directory
        app_dir = os.path.join(self.upload_folder, str(application_id))
        os.makedirs(app_dir, exist_ok=True)
        
        file_path = os.path.join(app_dir, filename)
        file.save(file_path)
        
        # Process file based on type
        if file_ext in ['jpg', 'jpeg', 'png']:
            self.process_image(file_path)
        elif file_ext == 'pdf':
            self.process_pdf(file_path)
        
        # Generate file hash
        file_hash = self.get_file_hash(file_path)
        file_size = os.path.getsize(file_path)
        
        return {
            'original_filename': original_filename,
            'file_path': file_path,
            'file_hash': file_hash,
            'file_size': file_size
        }
