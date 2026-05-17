from __future__ import annotations

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
)


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "laporan-mingguan"
EVIDENCE = ROOT / "docs" / "evidence"


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="TitleX",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=25,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=14,
        )
    )
    base.add(
        ParagraphStyle(
            name="SubX",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
        )
    )
    base.add(
        ParagraphStyle(
            name="H1X",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=8,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="H2X",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#0f766e"),
            spaceBefore=8,
            spaceAfter=5,
        )
    )
    base.add(
        ParagraphStyle(
            name="BodyX",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=13.2,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
        )
    )
    base.add(
        ParagraphStyle(
            name="SmallX",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#334155"),
        )
    )
    return base


S = styles()


def p(text: str, style: str = "BodyX") -> Paragraph:
    return Paragraph(text, S[style])


def bullets(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(p(item), bulletColor=colors.HexColor("#0f766e")) for item in items],
        bulletType="bullet",
        leftIndent=16,
    )


def table(rows: list[list[str]], widths: list[float] | None = None) -> Table:
    t = Table([[p(str(cell), "SmallX") for cell in row] for row in rows], colWidths=widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def screenshot(path: Path, width: float = 16.5 * cm, max_height: float = 21.5 * cm) -> Image:
    img = Image(str(path))
    ratio = img.imageHeight / float(img.imageWidth)
    draw_width = width
    draw_height = width * ratio
    if draw_height > max_height:
        draw_height = max_height
        draw_width = max_height / ratio
    img.drawWidth = draw_width
    img.drawHeight = draw_height
    return img


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(1.5 * cm, 1.0 * cm, doc.title)
    canvas.drawRightString(19.5 * cm, 1.0 * cm, f"Halaman {doc.page}")
    canvas.restoreState()


def cover(title: str, subtitle: str) -> list:
    return [
        Spacer(1, 2.6 * cm),
        p(title, "TitleX"),
        p(subtitle, "SubX"),
        p("Final Project Cloud Computing - Kelompok 11", "SubX"),
        p("Cloud-Based Data Processing and Monitoring Platform on Microsoft Azure", "SubX"),
        Spacer(1, 0.8 * cm),
        table(
            [
                ["Nama", "Peran"],
                ["Naufal Ihsan Sriyanto", "DevOps Engineer"],
                ["Zhykwa Ceryl Mavanudin", "Cloud Architect"],
                ["Muhammad Arifin Ilham", "Backend Developer"],
                ["Rendy Saputra", "Security Engineer"],
            ],
            [7 * cm, 8 * cm],
        ),
        PageBreak(),
    ]


def build_week1() -> list:
    story = cover("Laporan Minggu 1", "Perencanaan dan Arsitektur")
    story += [
        p("Tujuan", "H1X"),
        p("Minggu 1 berfokus pada penentuan tema proyek, pemilihan layanan cloud, desain arsitektur, estimasi biaya awal, pembagian peran anggota, dan kesiapan repository."),
        p("Tema dan Tujuan Proyek", "H2X"),
        p("Tema proyek adalah platform pemrosesan dan monitoring data berbasis cloud. Sistem menerima file JSON, CSV, XLSX, dan XLS, memproses data, menyimpan hasilnya, lalu menampilkan statistik dan chart pada dashboard web."),
        p("Layanan Yang Dipilih", "H2X"),
        table(
            [
                ["Platform", "Layanan", "Fungsi"],
                ["Cloudflare", "Cloudflare Pages", "Hosting frontend dashboard"],
                ["Cloudflare", "Pages Function", "Proxy /api same-origin"],
                ["Azure", "Azure Functions", "Backend API serverless"],
                ["Azure", "Blob Storage", "Penyimpanan file mentah raw-data"],
                ["Azure", "Cosmos DB", "Database telemetry dan user"],
                ["Azure", "Key Vault", "Penyimpanan secret"],
                ["Azure", "Application Insights", "Monitoring backend"],
                ["Azure", "VNet, NSG, Traffic Manager", "Jaringan dan routing/fallback"],
            ],
            [3 * cm, 4.3 * cm, 8.4 * cm],
        ),
        p("Pembagian Tugas", "H2X"),
        table(
            [
                ["Anggota", "Peran", "Fokus"],
                ["Naufal Ihsan Sriyanto", "DevOps Engineer", "Terraform, CI/CD, deployment"],
                ["Zhykwa Ceryl Mavanudin", "Cloud Architect", "Arsitektur dan network design"],
                ["Muhammad Arifin Ilham", "Backend Developer", "Azure Functions dan Cosmos DB"],
                ["Rendy Saputra", "Security Engineer", "IAM, Key Vault, NSG"],
            ],
            [5 * cm, 4 * cm, 6.8 * cm],
        ),
        p("Deliverable Minggu 1", "H2X"),
        bullets(
            [
                "Diagram arsitektur target tersedia di docs/evidence/architecture-final-target.png.",
                "Dokumen perencanaan tersedia di docs/week1-planning.md.",
                "Repository Git sudah memiliki README, struktur source code, dan folder dokumentasi.",
                "Layanan cloud yang digunakan sudah lebih dari 5 komponen terintegrasi.",
            ]
        ),
        PageBreak(),
        p("Bukti Diagram Arsitektur", "H1X"),
        screenshot(EVIDENCE / "architecture-final-target.png", 17.2 * cm),
    ]
    return story


def build_week2() -> list:
    story = cover("Laporan Minggu 2", "Implementasi Infrastruktur Dasar")
    story += [
        p("Tujuan", "H1X"),
        p("Minggu 2 membangun fondasi infrastruktur cloud menggunakan Terraform dan prinsip least privilege. Fokusnya adalah resource group, jaringan, subnet, NSG, compute, IAM, dan inventaris resource."),
        p("Infrastruktur Dasar", "H2X"),
        table(
            [
                ["Komponen", "Nama", "Fungsi"],
                ["Resource Group", "RG-Kelompok11", "Wadah semua resource Azure"],
                ["VNet", "VNet-Utama-Kelompok11", "Jaringan utama 10.0.0.0/16"],
                ["Public Subnet", "Subnet-Publik", "Subnet resource publik"],
                ["Private Subnet", "Subnet-Privat", "Subnet internal"],
                ["NSG Publik", "NSG-Publik-Kelompok11", "Firewall subnet publik"],
                ["NSG Privat", "NSG-Privat-Kelompok11", "Firewall subnet privat"],
                ["VM", "VM-Web-Kelompok11", "Compute opsional/management"],
                ["IAM/RBAC", "Role assignment tim", "Pembatasan akses berdasarkan peran"],
            ],
            [3.5 * cm, 5.2 * cm, 7 * cm],
        ),
        p("Kesesuaian Roadmap", "H2X"),
        bullets(
            [
                "Virtual Network dan dua subnet sudah dirancang.",
                "Network Security Group disiapkan untuk subnet publik dan privat.",
                "Compute layer tersedia melalui VM dan Azure Functions.",
                "IAM didokumentasikan pada docs/iam-config.md.",
                "Inventaris resource ada pada docs/resource-inventory.md.",
                "Konfigurasi Terraform lokal ada pada folder infra, tetapi tidak dipublikasi karena kebijakan keamanan repo.",
            ]
        ),
        p("Catatan Keamanan", "H2X"),
        p("SSH VM masih perlu hardening akhir dengan membatasi source IP admin dan menggunakan SSH key. File .tfvars, state Terraform, key, credential, dan zip artifact diabaikan oleh .gitignore agar tidak bocor ke repository publik."),
        p("Bukti Screenshot Yang Perlu Dilampirkan", "H2X"),
        table(
            [
                ["Bukti", "Lokasi"],
                ["Resource Group RG-Kelompok11", "Azure Portal > Resource groups"],
                ["VNet dan subnet", "Azure Portal > Virtual networks"],
                ["NSG rules", "Azure Portal > Network security groups"],
                ["IAM role assignment", "Azure Portal > Access control (IAM)"],
            ],
            [6.5 * cm, 9 * cm],
        ),
    ]
    return story


def build_week3() -> list:
    story = cover("Laporan Minggu 3", "Implementasi Layanan Inti")
    story += [
        p("Tujuan", "H1X"),
        p("Minggu 3 memastikan sistem berjalan end-to-end: frontend, proxy, backend, database, object storage, secret management, dan pengujian fungsional."),
        p("Komponen Layanan Inti", "H2X"),
        table(
            [
                ["Komponen", "Layanan", "Status"],
                ["Frontend", "Cloudflare Pages", "Selesai"],
                ["Proxy API", "Cloudflare Pages Function /api", "Selesai"],
                ["Backend", "Azure Functions Python", "Selesai"],
                ["Database", "Azure Cosmos DB", "Selesai"],
                ["Storage", "Azure Blob Storage raw-data", "Selesai"],
                ["Secrets", "Azure Key Vault dan Cloudflare env", "Selesai"],
                ["Monitoring", "Application Insights", "Selesai"],
            ],
            [4 * cm, 7 * cm, 4 * cm],
        ),
        p("Endpoint Utama", "H2X"),
        table(
            [
                ["Method", "Endpoint", "Fungsi"],
                ["GET", "/api/hello", "Health check"],
                ["POST", "/api/register", "Registrasi user"],
                ["POST", "/api/login", "Login user"],
                ["GET", "/api/me", "Profil user aktif"],
                ["GET", "/api/stats", "Statistik data"],
                ["GET", "/api/data", "Data terbaru"],
                ["POST", "/api/analyze", "Analisis data tanpa simpan"],
                ["POST", "/api/upload", "Upload JSON/CSV/XLSX/XLS"],
                ["GET", "/api/analytics", "Chart dan profiling"],
                ["GET", "/api/admin/users", "Admin-only user management"],
            ],
            [2 * cm, 4.7 * cm, 9 * cm],
        ),
        p("Pengujian Fungsional", "H2X"),
        bullets(
            [
                "Register user baru tersimpan di Cosmos DB container users.",
                "Login mengembalikan token sesi.",
                "Upload file diproses dan disimpan ke telemetry-data.",
                "User biasa hanya melihat data upload miliknya sendiri.",
                "Admin dapat melihat panel user management.",
                "Script test tersedia pada scripts/test-auth-db.ps1.",
            ]
        ),
        PageBreak(),
        p("Bukti UI Login", "H1X"),
        screenshot(EVIDENCE / "ui-login.png", 16 * cm),
        PageBreak(),
        p("Bukti UI Register", "H1X"),
        screenshot(EVIDENCE / "ui-register.png", 16 * cm),
        PageBreak(),
        p("Bukti Dashboard User", "H1X"),
        screenshot(EVIDENCE / "ui-user-preview.png", 17 * cm),
        PageBreak(),
        p("Bukti Dashboard Admin", "H1X"),
        screenshot(EVIDENCE / "ui-admin-preview.png", 17 * cm),
    ]
    return story


def build_week4() -> list:
    story = cover("Laporan Minggu 4", "Monitoring, Keamanan, dan Optimasi")
    story += [
        p("Tujuan", "H1X"),
        p("Minggu 4 berfokus pada operasional sistem: monitoring, alerting, centralized logging, security audit, backup/recovery, dan optimasi biaya."),
        p("Monitoring dan Alerting", "H2X"),
        table(
            [
                ["Area", "Implementasi", "Tujuan"],
                ["Application Insights", "Terhubung ke Azure Functions", "Request log, latency, exception"],
                ["Azure Monitor", "Alert rule operasional", "Deteksi error dan performa"],
                ["Action Group", "Email notifikasi tim", "Respons incident"],
                ["Dashboard aplikasi", "Statistik, tabel, dan chart", "Monitoring data hasil proses"],
            ],
            [4 * cm, 6 * cm, 5.7 * cm],
        ),
        p("Alert Rule Yang Disiapkan", "H2X"),
        table(
            [
                ["Alert", "Target", "Threshold"],
                ["Function 5xx Error", "Azure Function App", "HTTP 5xx > 5 dalam 5 menit"],
                ["Function Latency", "Azure Function App", "Average response time > 2 detik"],
                ["VM CPU High", "VM Web", "CPU rata-rata > 80 persen selama 5 menit"],
            ],
            [4 * cm, 5 * cm, 6.5 * cm],
        ),
        p("Security Baseline", "H2X"),
        table(
            [
                ["Area", "Kontrol", "Status"],
                ["Frontend secret", "Browser hanya memanggil /api", "Selesai"],
                ["Function key", "Cloudflare env server-side", "Selesai"],
                ["Cosmos secret", "Azure Key Vault", "Selesai"],
                ["Password", "PBKDF2 hash", "Selesai"],
                ["Role", "Register publik role user", "Selesai"],
                ["Data isolation", "Filter owner_user_id", "Selesai"],
                ["Repo hygiene", ".env/.tfvars/state/key di-ignore", "Selesai"],
                ["VM SSH", "Batasi IP admin", "Perlu hardening"],
            ],
            [3.3 * cm, 8 * cm, 4 * cm],
        ),
        p("Backup dan Recovery", "H2X"),
        bullets(
            [
                "Cosmos DB mengandalkan backup platform Azure sesuai konfigurasi account.",
                "Blob Storage raw-data dapat digunakan untuk reprocessing.",
                "Source code tersimpan di GitHub sebagai version control.",
                "Simulasi recovery disarankan: upload file kecil, verifikasi Cosmos DB, export sample record, lalu proses ulang file.",
            ]
        ),
        p("Cost Optimization", "H2X"),
        table(
            [
                ["Optimasi", "Dampak"],
                ["Cloudflare Pages", "Mengurangi kebutuhan VM untuk frontend"],
                ["Azure Functions Consumption", "Mengurangi biaya backend idle"],
                ["Cosmos DB Serverless", "Cocok untuk traffic kecil proyek"],
                ["Storage lifecycle policy", "Mengontrol pertumbuhan file mentah"],
                ["Matikan VM saat tidak demo", "Mengurangi biaya compute"],
            ],
            [6 * cm, 9.4 * cm],
        ),
        p("Screenshot Yang Perlu Diambil Dari Portal", "H2X"),
        table(
            [
                ["Bukti", "Lokasi"],
                ["Application Insights overview", "Azure Portal > Application Insights"],
                ["Alert rules dan action group", "Azure Monitor > Alerts"],
                ["Cost breakdown", "Azure Cost Management"],
                ["Security posture", "Defender for Cloud"],
                ["Backup/recovery evidence", "Cosmos DB / Storage"],
            ],
            [6.5 * cm, 9 * cm],
        ),
        p("Catatan", "H2X"),
        p("Sebelum screenshot portal dimasukkan ke laporan, pastikan tidak ada function key, Cloudflare API token, connection string, access key, password, file tfvars, atau tenant/subscription ID penuh yang terlihat."),
        PageBreak(),
        p("Bukti Azure - Application Insights dan Metrics", "H1X"),
        screenshot(EVIDENCE / "week4-application-insights-metrics.png", 17 * cm),
        PageBreak(),
        p("Bukti Azure - Alert Rules dan Action Group", "H1X"),
        screenshot(EVIDENCE / "week4-alert-rules-action-group.png", 17 * cm),
        PageBreak(),
        p("Bukti Azure - Cosmos DB dan Blob Storage", "H1X"),
        screenshot(EVIDENCE / "week4-cosmos-storage-backup.png", 17 * cm),
        PageBreak(),
        p("Bukti Azure - Security dan Cost Management", "H1X"),
        screenshot(EVIDENCE / "week4-security-cost-management.png", 17 * cm),
    ]
    return story


REPORTS = [
    ("Laporan_Minggu_1_Perencanaan_Arsitektur.pdf", "Laporan Minggu 1 - Kelompok 11", build_week1),
    ("Laporan_Minggu_2_Infrastruktur_Dasar.pdf", "Laporan Minggu 2 - Kelompok 11", build_week2),
    ("Laporan_Minggu_3_Layanan_Inti.pdf", "Laporan Minggu 3 - Kelompok 11", build_week3),
    ("Laporan_Minggu_4_Monitoring_Keamanan_Optimasi.pdf", "Laporan Minggu 4 - Kelompok 11", build_week4),
]


def build_pdf(filename: str, title: str, story_builder) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output = OUT_DIR / filename
    doc = SimpleDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.6 * cm,
        title=title,
        author="Kelompok 11",
    )
    doc.build(story_builder(), onFirstPage=header_footer, onLaterPages=header_footer)
    return output


def main() -> None:
    for filename, title, builder in REPORTS:
        print(build_pdf(filename, title, builder))


if __name__ == "__main__":
    main()
