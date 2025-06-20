"""
Serverless-optimized utilities for Vercel deployment
Minimal memory footprint and fast cold starts
"""
import os
import json
import hashlib
from datetime import datetime
from werkzeug.utils import secure_filename

class ServerlessFileHandler:
    """Ultra-lightweight file handler for serverless"""
    
    def __init__(self):
        self.allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
        self.max_file_size = 10 * 1024 * 1024  # 10MB limit
    
    def allowed_file(self, filename):
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def get_file_info(self, file):
        """Get file info without heavy processing"""
        return {
            'filename': secure_filename(file.filename),
            'size': len(file.read()),
            'type': file.content_type,
            'timestamp': datetime.now().isoformat()
        }
    
    def generate_file_hash(self, file_content):
        """Generate hash from file content"""
        return hashlib.sha256(file_content).hexdigest()

class ServerlessReportGenerator:
    """Generate reports without heavy dependencies"""
    
    @staticmethod
    def generate_json_report(data, report_type):
        """Generate JSON report instead of Excel"""
        report = {
            'report_type': report_type,
            'generated_at': datetime.now().isoformat(),
            'data': data,
            'summary': {
                'total_records': len(data) if isinstance(data, list) else 1,
                'report_format': 'JSON'
            }
        }
        return json.dumps(report, indent=2, default=str)
    
    @staticmethod
    def generate_csv_report(data, headers=None):
        """Generate CSV report"""
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        if headers:
            writer.writerow(headers)
        
        if isinstance(data, list):
            for row in data:
                if isinstance(row, dict):
                    writer.writerow(row.values())
                else:
                    writer.writerow(row)
        
        return output.getvalue()

# Export optimized instances
serverless_file_handler = ServerlessFileHandler()
serverless_report_generator = ServerlessReportGenerator()
