from flask import send_file
from io import BytesIO
from datetime import datetime
from utils.dynamic_imports import requires_pdf, importer

@requires_pdf
def generate_permit_pdf(application):
    """Generate permit PDF using dynamic imports"""
    reportlab = importer.get_reportlab()
    canvas = reportlab['canvas']
    pagesizes = reportlab['pagesizes']
    
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=pagesizes.A4)
    width, height = pagesizes.A4

    # Header
    c.setFont("Helvetica-Bold", 14)
    c.drawString(30, height - 40, "Form GW7B")
    c.setFont("Helvetica", 12)
    c.drawString(30, height - 60, "TEMPORARY/PROVISIONAL* SPECIFIC GROUNDWATER ABSTRACTION PERMIT")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 80, "(Section 15 (3) (a) of Water (Permits) Regulations, 2001)")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(30, height - 110, "The MANYAME Catchment Council hereby grants a *Temporary/Provisional General Abstraction Permit to:")
    c.setFont("Helvetica", 10)
    c.drawString(30, height - 130, "Catchment:  MANYAME     Sub-Catchment: UPPER MANYAME")

    # Applicant details
    y = height - 160
    c.setFont("Helvetica", 10)
    c.drawString(30, y, f"1.  Name of Applicant:  {application.applicant_name}")
    y -= 20
    c.drawString(30, y, f"2.  Physical address: {application.physical_address}")
    y -= 20
    c.drawString(30, y, f"3.  Postal address: ")
    y -= 20
    c.drawString(30, y, f"4.  Number of drilled boreholes: {application.num_boreholes}")
    c.drawString(300, y, f"5.  Size of land or property: {application.land_size} (ha)")
    y -= 20
    c.drawString(30, y, f"Total allocated abstraction (m3/annum): {application.water_allocation}")
    y -= 30
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, y, "Borehole (BH)-No.   BH-No. Allocated   Grid Reference   GPS reading   Intended usea   Maximum abstraction rate (m3/annum)   Water sample analysis every . months/years")
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(30, y, f"1   -   -   X: {application.gps_x}   Y: {application.gps_y}   {application.permit_type}   -   -")
    y -= 30
    c.drawString(30, y, f"a Intended use: irrigation, livestock farming, industrial, mining, urban, national parks, other (specify): {application.permit_type}")
    y -= 30
    c.drawString(30, y, f"This Temporary/Provisional* Specific Abstraction Permit has been recorded in the register as:")
    y -= 20
    c.drawString(30, y, f"Permit No: {application.permit_number}    Valid until: {application.valid_until.strftime('%Y-%m-%d') if application.valid_until else ''}")
    y -= 30
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, y, "CONDITIONS")
    y -= 20
    c.setFont("Helvetica", 9)
    c.drawString(30, y, "It is illegal to abstract groundwater for any other purpose other than primary purposes without an abstraction permit. ...")
    y -= 40
    c.setFont("Helvetica-Bold", 10)
    c.drawString(30, y, "ADDITIONAL CONDITIONS")
    y -= 20
    c.setFont("Helvetica", 9)
    c.drawString(30, y, "1. To install flow meters on all boreholes and keep records of water used")
    y -= 15
    c.drawString(30, y, "2. Water Quality Analysis is to be carried out at most after every 3 months")
    y -= 15
    c.drawString(30, y, "3. To submit abstraction and water quality records to catchment offices every six (6) months")
    y -= 15
    c.drawString(30, y, "4. To allow unlimited access to ZINWA and SUB-CATCHMENT COUNCIL staff")
    y -= 15
    c.drawString(30, y, "5. No cost shall be demanded from the Catchment Council in the event of permit cancellation")
    y -= 40
    c.setFont("Helvetica", 10)
    c.drawString(30, y, "Name (print)        Signature        Official Date Stamp (Catchment Council Chairperson)")
    c.showPage()
    c.save()
    buffer.seek(0)
    
    return send_file(
        buffer, 
        as_attachment=True, 
        download_name=f"Permit_{application.permit_number}.pdf", 
        mimetype='application/pdf'
    )
