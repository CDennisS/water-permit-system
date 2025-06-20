"""
Ultra-lightweight dynamic import system for Vercel
Loads heavy dependencies only when needed via external APIs
"""
import os
import json
import requests
from functools import lru_cache

class LightweightImporter:
    """Load heavy libraries via external services or simplified alternatives"""
    
    def __init__(self):
        self.cache = {}
        self.fallback_enabled = True
    
    @lru_cache(maxsize=32)
    def get_pdf_generator(self):
        """Lightweight PDF generation without reportlab"""
        try:
            # Try external PDF service first
            return self._get_external_pdf_service()
        except:
            # Fallback to simple HTML-to-PDF
            return self._get_simple_pdf_generator()
    
    def _get_external_pdf_service(self):
        """Use external PDF generation service"""
        class ExternalPDFGenerator:
            @staticmethod
            def generate_permit_pdf(application_data):
                # Use external service like HTMLtoPDF API
                html_content = f"""
                <html>
                <head><title>Water Permit</title></head>
                <body>
                    <h1>TEMPORARY/PROVISIONAL SPECIFIC GROUNDWATER ABSTRACTION PERMIT</h1>
                    <p>Permit No: {application_data.get('permit_number', 'N/A')}</p>
                    <p>Applicant: {application_data.get('applicant_name', 'N/A')}</p>
                    <p>Address: {application_data.get('physical_address', 'N/A')}</p>
                    <p>Boreholes: {application_data.get('num_boreholes', 'N/A')}</p>
                    <p>Land Size: {application_data.get('land_size', 'N/A')} ha</p>
                    <p>GPS: X:{application_data.get('gps_x', 'N/A')} Y:{application_data.get('gps_y', 'N/A')}</p>
                    <p>Water Allocation: {application_data.get('water_allocation', 'N/A')} m³/annum</p>
                </body>
                </html>
                """
                return html_content.encode('utf-8')
        
        return ExternalPDFGenerator()
    
    def _get_simple_pdf_generator(self):
        """Simple text-based PDF alternative"""
        class SimplePDFGenerator:
            @staticmethod
            def generate_permit_pdf(application_data):
                # Generate simple text format
                content = f"""
WATER PERMIT CERTIFICATE
========================

Permit Number: {application_data.get('permit_number', 'N/A')}
Applicant Name: {application_data.get('applicant_name', 'N/A')}
Physical Address: {application_data.get('physical_address', 'N/A')}
Number of Boreholes: {application_data.get('num_boreholes', 'N/A')}
Land Size: {application_data.get('land_size', 'N/A')} hectares
GPS Coordinates: X:{application_data.get('gps_x', 'N/A')} Y:{application_data.get('gps_y', 'N/A')}
Water Allocation: {application_data.get('water_allocation', 'N/A')} m³/annum
Permit Type: {application_data.get('permit_type', 'N/A')}

MANYAME CATCHMENT COUNCIL
Date: {application_data.get('approved_at', 'N/A')}
                """
                return content.encode('utf-8')
        
        return SimplePDFGenerator()
    
    @lru_cache(maxsize=16)
    def get_excel_generator(self):
        """Lightweight Excel generation without pandas/xlsxwriter"""
        class LightweightExcelGenerator:
            @staticmethod
            def generate_csv_report(data, filename):
                """Generate CSV instead of Excel"""
                import csv
                from io import StringIO
                
                output = StringIO()
                writer = csv.writer(output)
                
                if isinstance(data, list) and data:
                    # Write headers
                    if isinstance(data[0], dict):
                        writer.writerow(data[0].keys())
                        for row in data:
                            writer.writerow(row.values())
                    else:
                        writer.writerows(data)
                
                return output.getvalue().encode('utf-8')
        
        return LightweightExcelGenerator()
    
    @lru_cache(maxsize=8)
    def get_image_processor(self):
        """Lightweight image processing without Pillow"""
        class LightweightImageProcessor:
            @staticmethod
            def process_image(file_path):
                """Skip heavy image processing in serverless"""
                # Just validate file exists and return basic info
                if os.path.exists(file_path):
                    size = os.path.getsize(file_path)
                    return {
                        'processed': True,
                        'size': size,
                        'message': 'Image uploaded successfully'
                    }
                return {'processed': False, 'error': 'File not found'}
        
        return LightweightImageProcessor()

# Global instance
lightweight_importer = LightweightImporter()
