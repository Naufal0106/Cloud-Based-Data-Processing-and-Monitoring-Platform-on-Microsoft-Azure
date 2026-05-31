from __future__ import annotations
import re
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
)

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "docs" / "Laporan_Teknis_Akhir_Kelompok_11.md"
PDF_PATH = ROOT / "docs" / "Laporan_Teknis_Akhir_Kelompok_11.pdf"
EVIDENCE_DIR = ROOT / "docs" / "evidence"

def get_styles():
    base = getSampleStyleSheet()
    
    # Custom colors
    primary_color = colors.HexColor("#0f4c81") # Classic Navy Blue
    secondary_color = colors.HexColor("#0f766e") # Deep Teal
    dark_neutral = colors.HexColor("#1e293b") # Slate 800
    light_neutral = colors.HexColor("#f8fafc") # Slate 50
    border_color = colors.HexColor("#cbd5e1") # Slate 300

    styles = {
        "TitleX": ParagraphStyle(
            name="TitleX",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=32,
            alignment=TA_CENTER,
            textColor=primary_color,
            spaceAfter=20,
        ),
        "SubTitleX": ParagraphStyle(
            name="SubTitleX",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
            spaceAfter=10,
        ),
        "SubTitleBold": ParagraphStyle(
            name="SubTitleBold",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=20,
        ),
        "H1X": ParagraphStyle(
            name="H1X",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=22,
            textColor=primary_color,
            spaceBefore=18,
            spaceAfter=12,
            keepWithNext=True,
        ),
        "H2X": ParagraphStyle(
            name="H2X",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=18,
            textColor=secondary_color,
            spaceBefore=14,
            spaceAfter=10,
            keepWithNext=True,
        ),
        "H3X": ParagraphStyle(
            name="H3X",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=16,
            textColor=dark_neutral,
            spaceBefore=12,
            spaceAfter=8,
            keepWithNext=True,
        ),
        "BodyX": ParagraphStyle(
            name="BodyX",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=11,          # Arial 11pt equivalent
            leading=16.5,        # 1.5 line spacing
            alignment=TA_JUSTIFY,
            spaceAfter=10,
        ),
        "CodeX": ParagraphStyle(
            name="CodeX",
            parent=base["Code"],
            fontName="Courier",
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#0f172a"),
            backColor=colors.HexColor("#f1f5f9"),
            borderColor=colors.HexColor("#e2e8f0"),
            borderWidth=0.5,
            borderPadding=8,
            spaceBefore=8,
            spaceAfter=8,
        ),
        "BulletX": ParagraphStyle(
            name="BulletX",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=11,          # Arial 11pt equivalent
            leading=16.5,        # 1.5 line spacing
            alignment=TA_LEFT,
            spaceAfter=6,
        ),
    }
    return styles

def format_markdown_text(text: str) -> str:
    # Escape standard XML characters except tags we might add
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    # Restore HTML-like formatting that ReportLab paragraph handles
    # **bold** -> <b>bold</b>
    text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
    # *italic* -> <i>italic</i>
    text = re.sub(r"\*(.*?)\*", r"<i>\1</i>", text)
    # `code` -> <font face="Courier">\1</font>
    text = re.sub(r"`(.*?)`", r'<font face="Courier" size="9.5" color="#0f766e"><b>\1</b></font>', text)
    
    # Clean up standard links [text](url) -> <a href="url"><u>text</u></a>
    text = re.sub(r"\[(.*?)\]\((.*?)\)", r'<font color="#0f4c81"><u>\1</u></font>', text)
    
    # Convert math equations to clean representation
    text = text.replace("$$IQR = Q_3 - Q_1$$", "<i>IQR = Q₃ - Q₁</i>")
    text = text.replace("$$\\text{Batas Bawah} = Q_1 - 1.5 \\times IQR$$", "<i>Batas Bawah = Q₁ - 1.5 × IQR</i>")
    text = text.replace("$$\\text{Batas Atas} = Q_3 + 1.5 \\times IQR$$", "<i>Batas Atas = Q₃ + 1.5 × IQR</i>")
    
    return text

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    
    # Header (on all pages except the cover page)
    if doc.page > 1:
        canvas.drawString(2.5 * cm, 28.2 * cm, "Laporan Teknis Akhir Kelompok 11 | Cloud Computing UPR")
        canvas.setStrokeColor(colors.HexColor("#cbd5e1"))
        canvas.setLineWidth(0.5)
        canvas.line(2.5 * cm, 28.0 * cm, 18.5 * cm, 28.0 * cm)
        
        # Footer
        canvas.drawRightString(18.5 * cm, 1.2 * cm, f"Halaman {doc.page}")
        canvas.drawString(2.5 * cm, 1.2 * cm, "Cloud-Based Data Processing & Monitoring Platform on Microsoft Azure")
        canvas.line(2.5 * cm, 1.5 * cm, 18.5 * cm, 1.5 * cm)
        
    canvas.restoreState()

def get_scaled_image(path: Path, max_width: float = 15.5 * cm, max_height: float = 12.0 * cm) -> Image:
    img = Image(str(path))
    ratio = img.imageHeight / float(img.imageWidth)
    draw_width = max_width
    draw_height = max_width * ratio
    if draw_height > max_height:
        draw_height = max_height
        draw_width = max_height / ratio
    img.drawWidth = draw_width
    img.drawHeight = draw_height
    return img

def build_pdf():
    print(f"Reading markdown from {MD_PATH}...")
    with open(MD_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    styles = get_styles()
    story = []

    # --- Title Page (Cover) ---
    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph("LAPORAN TEKNIS AKHIR", styles["TitleX"]))
    story.append(Paragraph("CLOUD-BASED DATA PROCESSING AND MONITORING PLATFORM ON MICROSOFT AZURE", styles["TitleX"]))
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("Proyek Akhir Kuliah - Minggu 1 s.d. Minggu 5", styles["SubTitleBold"]))
    story.append(Paragraph("Program Studi Teknik Informatika<br/>Universitas Palangka Raya", styles["SubTitleX"]))
    story.append(Spacer(1, 2.5 * cm))
    
    # Members Table
    members_data = [
        [Paragraph("<b>Nama</b>", styles["BulletX"]), Paragraph("<b>Peran / Tugas Utama</b>", styles["BulletX"])],
        [Paragraph("Naufal Ihsan Sriyanto", styles["BulletX"]), Paragraph("DevOps Engineer / Infrastructure Lead", styles["BulletX"])],
        [Paragraph("Muhammad Arifin Ilham", styles["BulletX"]), Paragraph("Backend Developer / Data Engineer", styles["BulletX"])],
        [Paragraph("Zhykwa Ceryl Mavanudin", styles["BulletX"]), Paragraph("Cloud Architect / Network Planner", styles["BulletX"])],
        [Paragraph("Rendy Saputra", styles["BulletX"]), Paragraph("Security Engineer / IAM Auditor", styles["BulletX"])],
    ]
    t = Table(members_data, colWidths=[6.0 * cm, 10.0 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(t)
    story.append(PageBreak())

    # --- Abstract (Abstrak) Page ---
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("ABSTRAK", styles["H1X"]))
    story.append(Spacer(1, 0.5 * cm))
    abstrak_text = (
        "Perkembangan pemrosesan data telemetri dalam jumlah besar secara real-time memerlukan "
        "infrastruktur awan yang aman, skalabel, dan efisien dari segi biaya. Proyek ini "
        "mengimplementasikan <i>Cloud-Based Data Processing & Monitoring Platform</i> menggunakan "
        "arsitektur hybrid. Antarmuka pengguna (frontend) statis di-deploy pada Cloudflare Pages "
        "untuk mengoptimalkan performa pengiriman global melalui jaringan CDN. API backend dan logika "
        "pemrosesan dijalankan secara serverless menggunakan Azure Functions (Python 3.11). Platform "
        "ini mendukung pengunggahan dataset dalam format JSON, CSV, dan Excel dengan ukuran maksimal "
        "100 MB. Pembersihan data otomatis dirancang menggunakan metode statistika Interquartile Range (IQR) "
        "untuk mendeteksi pencilan (outliers) dan menghapus data kosong (missing values). Data hasil olahan "
        "disimpan ke dalam database NoSQL Azure Cosmos DB. Keamanan data diperkuat melalui implementasi "
        "Network Security Group (NSG) dengan port SSH 22 terbatas, isolasi data berbasis token JWT, dan "
        "secret management menggunakan Azure Key Vault. Observability diimplementasikan secara komprehensif "
        "melalui Azure Application Insights dan Azure Monitor Alerts untuk menjamin keandalan sistem. "
        "Seluruh infrastruktur disediakan secara otomatis menggunakan Terraform sebagai implementasi "
        "Infrastructure as Code (IaC). Hasil pengujian menunjukkan bahwa platform mampu memproses data "
        "telemetri secara andal dengan latensi rendah dan pembersihan data science yang akurat."
    )
    story.append(Paragraph(abstrak_text, styles["BodyX"]))
    story.append(PageBreak())

    # --- Content Parsing ---
    lines = content.split("\n")
    in_code_block = False
    in_daftar_isi = False
    code_lines = []
    
    for line in lines:
        stripped = line.strip()
        
        # Handle code blocks
        if stripped.startswith("```"):
            if in_code_block:
                # End of code block
                code_text = "\n".join(code_lines)
                # Escape code block text for ReportLab Paragraph compatibility
                escaped_code = code_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(f"<pre>{escaped_code}</pre>", styles["CodeX"]))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue
            
        if in_code_block:
            code_lines.append(line)
            continue
            
        # Ignore markdown titles that we already formatted for the cover page
        if stripped.startswith("# LAPORAN TEKNIS AKHIR") or stripped.startswith("## PROYEK KELOMPOK 11"):
            continue
            
        # Parse titles and content
        if stripped.startswith("# "):
            title_text = format_markdown_text(stripped[2:])
            # If it's a new BAB, start a new page
            if "BAB " in title_text or "Daftar Pustaka" in title_text or "Lampiran" in title_text:
                story.append(PageBreak())
            story.append(Paragraph(title_text, styles["H1X"]))
            story.append(Spacer(1, 0.2 * cm))
            
        elif stripped.startswith("## "):
            title_text = format_markdown_text(stripped[3:])
            story.append(Paragraph(title_text, styles["H2X"]))
            story.append(Spacer(1, 0.1 * cm))
            
        elif stripped.startswith("### "):
            title_text = format_markdown_text(stripped[4:])
            story.append(Paragraph(title_text, styles["H3X"]))
            story.append(Spacer(1, 0.1 * cm))
            if "DAFTAR ISI" in title_text:
                in_daftar_isi = True
            
            # If this is section 3.1, append the architecture diagram
            if "3.1 Diagram Topologi" in title_text:
                img_path = EVIDENCE_DIR / "architecture-final-target.png"
                if img_path.exists():
                    img = get_scaled_image(img_path, max_width=16.0 * cm, max_height=14.0 * cm)
                    story.append(KeepTogether([Spacer(1, 0.3 * cm), img, Spacer(1, 0.4 * cm)]))
            
        elif stripped == "---":
            if in_daftar_isi:
                story.append(PageBreak())
                in_daftar_isi = False
            else:
                # Add a subtle line divider
                t_line = Table([[""]], colWidths=[16.0 * cm])
                t_line.setStyle(TableStyle([
                    ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                ]))
                story.append(t_line)
                story.append(Spacer(1, 0.2 * cm))
            
        elif stripped == "":
            continue
            
        elif stripped.startswith("* ") or stripped.startswith("- "):
            # Check if this item references an image in the raw line before formatting
            image_match = re.search(r"docs/evidence/([\w\.\-]+)", stripped)
            img_element = None
            if image_match:
                img_name = image_match.group(1)
                img_path = EVIDENCE_DIR / img_name
                if img_path.exists():
                    img = get_scaled_image(img_path, max_width=15.5 * cm, max_height=11.0 * cm)
                    img_element = KeepTogether([Spacer(1, 0.2 * cm), img, Spacer(1, 0.4 * cm)])
            
            # Now format the bullet items text
            bullet_content = format_markdown_text(stripped[2:])
            story.append(Paragraph(f"&bull; {bullet_content}", styles["BulletX"]))
            if img_element:
                story.append(img_element)
            
        elif re.match(r"^\d+\.\s", stripped):
            # Numbered items
            num_match = re.match(r"^(\d+)\.\s(.*)", stripped)
            num = num_match.group(1)
            num_content = format_markdown_text(num_match.group(2))
            story.append(Paragraph(f"{num}. {num_content}", styles["BulletX"]))
            
        else:
            # Normal paragraph
            body_content = format_markdown_text(line)
            story.append(Paragraph(body_content, styles["BodyX"]))
            
    # Build Document
    print(f"Building PDF to {PDF_PATH}...")
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.5 * cm,
        title="Laporan Teknis Akhir Kelompok 11",
        author="Kelompok 11",
    )
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print("PDF generation complete!")

if __name__ == "__main__":
    build_pdf()
