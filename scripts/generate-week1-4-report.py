from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    KeepTogether,
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
OUT = ROOT / "docs" / "Laporan_Minggu_1-4_Kelompok_11.pdf"
EVIDENCE = ROOT / "docs" / "evidence"


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=18,
            textColor=colors.HexColor("#0f172a"),
        )
    )
    base.add(
        ParagraphStyle(
            name="CoverSub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155"),
        )
    )
    base.add(
        ParagraphStyle(
            name="H1x",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=21,
            spaceBefore=8,
            spaceAfter=10,
            textColor=colors.HexColor("#0f172a"),
        )
    )
    base.add(
        ParagraphStyle(
            name="H2x",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            spaceBefore=8,
            spaceAfter=6,
            textColor=colors.HexColor("#0f766e"),
        )
    )
    base.add(
        ParagraphStyle(
            name="Bodyx",
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
            name="Smallx",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#475569"),
        )
    )
    return base


S = styles()


def p(text: str, style: str = "Bodyx") -> Paragraph:
    return Paragraph(text, S[style])


def bullets(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(p(item), bulletColor=colors.HexColor("#0f766e")) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=16,
    )


def table(rows: list[list[str]], widths: list[float] | None = None) -> Table:
    data = [[p(str(cell), "Smallx") for cell in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
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


def image(path: Path, width: float = 16.5 * cm, max_height: float = 22.0 * cm) -> KeepTogether:
    img = Image(str(path))
    ratio = img.imageHeight / float(img.imageWidth)
    draw_width = width
    draw_height = width * ratio
    if draw_height > max_height:
        draw_height = max_height
        draw_width = max_height / ratio
    img.drawWidth = draw_width
    img.drawHeight = draw_height
    return KeepTogether([img, Spacer(1, 0.2 * cm)])


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.drawString(1.5 * cm, 1.0 * cm, "Final Project Cloud Computing - Kelompok 11")
    canvas.drawRightString(19.5 * cm, 1.0 * cm, f"Halaman {doc.page}")
    canvas.restoreState()


def build() -> list:
    story = []

    story += [
        Spacer(1, 4.5 * cm),
        p("Laporan Roadmap Minggu 1-4", "CoverTitle"),
        p("Cloud-Based Data Processing and Monitoring Platform on Microsoft Azure", "CoverSub"),
        Spacer(1, 0.4 * cm),
        p("Final Project Cloud Computing - Kelompok 11", "CoverSub"),
        p("Teknik Informatika - Universitas Palangka Raya", "CoverSub"),
        Spacer(1, 1.2 * cm),
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
        Spacer(1, 1.0 * cm),
        p(
            "Dokumen ini merangkum kesesuaian pekerjaan Minggu 1 sampai Minggu 4 terhadap roadmap Final Project Cloud Computing. Isi laporan berfokus pada perencanaan, infrastruktur dasar, layanan inti end-to-end, monitoring, keamanan, backup, dan optimasi biaya.",
            "Bodyx",
        ),
        PageBreak(),
    ]

    story += [
        p("Ringkasan Eksekutif", "H1x"),
        p(
            "Project yang dibangun adalah platform pemrosesan dan monitoring data berbasis cloud. Frontend berjalan di Cloudflare Pages pada domain kelompok11cc.my.id, sedangkan backend, database, storage, secret management, dan observability berjalan di Microsoft Azure. Sistem menerima data JSON, CSV, XLSX, dan XLS, melakukan parsing, profiling, cleaning opsional, klasifikasi status, lalu menyimpan hasilnya ke Azure Cosmos DB.",
        ),
        table(
            [
                ["Minggu", "Fokus Roadmap", "Status", "Bukti Utama"],
                ["1", "Perencanaan dan arsitektur", "Selesai", "Diagram arsitektur, dokumen planning, role tim"],
                ["2", "Infrastruktur dasar, jaringan, IAM, IaC", "Selesai", "Terraform lokal, inventaris resource, IAM, NSG"],
                ["3", "Layanan inti end-to-end", "Selesai", "Frontend, backend, proxy API, Cosmos DB, Blob Storage, screenshot UI"],
                ["4", "Monitoring, keamanan, backup, optimasi", "Baseline selesai", "Application Insights, alert plan, security audit, cost notes, checklist screenshot portal"],
            ],
            [1.8 * cm, 5.1 * cm, 3.0 * cm, 6.5 * cm],
        ),
        Spacer(1, 0.2 * cm),
        p(
            "Catatan: beberapa bukti Minggu 4 seperti Azure Monitor, Defender for Cloud, Cost Management, dan backup/recovery tetap perlu dilengkapi dengan screenshot dari Azure Portal karena membutuhkan sesi login cloud yang aktif.",
        ),
        PageBreak(),
    ]

    story += [
        p("Minggu 1 - Perencanaan dan Arsitektur", "H1x"),
        p("Tujuan minggu pertama adalah menentukan tema, memilih cloud provider, membuat arsitektur target, menyusun estimasi biaya, membagi peran anggota, dan menyiapkan repository."),
        p("Tema Project", "H2x"),
        p("Cloud-Based Data Processing and Monitoring Platform on Microsoft Azure. Tema ini dipilih karena memenuhi komponen compute, storage, database, networking, monitoring, security, dan deployment."),
        p("Layanan Cloud Yang Digunakan", "H2x"),
        table(
            [
                ["Platform", "Layanan", "Fungsi"],
                ["Cloudflare", "Cloudflare Pages", "Hosting frontend dashboard dan edge delivery"],
                ["Cloudflare", "Pages Function", "Proxy same-origin /api agar Azure Function key tidak muncul di browser"],
                ["Azure", "Azure Functions", "Backend API dan pemrosesan data serverless"],
                ["Azure", "Azure Blob Storage", "Container raw-data untuk file mentah JSON/CSV/Excel"],
                ["Azure", "Azure Cosmos DB", "Database NoSQL untuk telemetry dan user"],
                ["Azure", "Azure Key Vault", "Penyimpanan secret backend"],
                ["Azure", "Application Insights", "Observability backend"],
                ["Azure", "Virtual Network, NSG, Traffic Manager", "Jaringan, kontrol akses, dan routing/failover"],
            ],
            [3.0 * cm, 4.2 * cm, 8.8 * cm],
        ),
        p("Pembagian Peran", "H2x"),
        table(
            [
                ["Anggota", "Peran", "Fokus"],
                ["Naufal Ihsan Sriyanto", "DevOps Engineer", "Terraform, GitHub Actions, deployment"],
                ["Zhykwa Ceryl Mavanudin", "Cloud Architect", "Arsitektur cloud dan network design"],
                ["Muhammad Arifin Ilham", "Backend Developer", "Azure Functions dan Cosmos DB"],
                ["Rendy Saputra", "Security Engineer", "IAM, Key Vault, NSG, security review"],
            ],
            [5.0 * cm, 4.0 * cm, 7.0 * cm],
        ),
        PageBreak(),
        p("Bukti Diagram Arsitektur", "H2x"),
        image(EVIDENCE / "architecture-final-target.png", 17.2 * cm),
        PageBreak(),
    ]

    story += [
        p("Minggu 2 - Implementasi Infrastruktur Dasar", "H1x"),
        p("Minggu kedua berfokus pada fondasi infrastruktur cloud menggunakan Infrastructure as Code. Infrastruktur utama dikelola dalam folder infra secara lokal, sementara dokumentasi publik menjelaskan desain tanpa membuka secret."),
        p("Resource Dasar", "H2x"),
        table(
            [
                ["Resource", "Nama", "Fungsi"],
                ["Resource Group", "RG-Kelompok11", "Wadah resource Azure"],
                ["Virtual Network", "VNet-Utama-Kelompok11", "Jaringan utama 10.0.0.0/16"],
                ["Public Subnet", "Subnet-Publik", "Subnet untuk resource publik/VM"],
                ["Private Subnet", "Subnet-Privat", "Subnet internal untuk isolasi"],
                ["NSG Publik", "NSG-Publik-Kelompok11", "Allow HTTP/HTTPS/SSH, deny lainnya"],
                ["NSG Privat", "NSG-Privat-Kelompok11", "Allow internal, deny internet"],
                ["Linux VM", "VM-Web-Kelompok11", "Compute opsional/web/management"],
                ["IAM/RBAC", "Role assignment tim", "Least privilege berdasarkan peran"],
            ],
            [3.5 * cm, 5.0 * cm, 7.5 * cm],
        ),
        p("Kesesuaian Dengan Roadmap", "H2x"),
        bullets(
            [
                "Virtual Network dan dua subnet sudah dirancang.",
                "Network Security Group tersedia untuk subnet publik dan privat.",
                "Compute layer tersedia melalui VM dan Azure Functions.",
                "IAM/RBAC didokumentasikan pada docs/iam-config.md.",
                "Terraform digunakan sebagai pendekatan Infrastructure as Code.",
                "Inventaris resource tersedia pada docs/resource-inventory.md.",
            ]
        ),
        p("Catatan Hardening", "H2x"),
        p("Untuk production, akses SSH VM sebaiknya dibatasi ke IP admin dan password authentication diganti ke SSH key. Catatan ini sengaja ditulis sebagai rekomendasi karena keamanan VM sangat bergantung pada IP publik operator saat deployment."),
        PageBreak(),
    ]

    story += [
        p("Minggu 3 - Implementasi Layanan Inti", "H1x"),
        p("Minggu ketiga adalah bagian inti sistem. Pada tahap ini layanan utama harus dapat diakses end-to-end dari frontend hingga backend dan database."),
        table(
            [
                ["Komponen", "Layanan", "Status"],
                ["Frontend", "Cloudflare Pages + HTML/CSS/JavaScript", "Selesai"],
                ["Proxy API", "Cloudflare Pages Function /api", "Selesai"],
                ["Backend", "Azure Functions Python 3.11", "Selesai"],
                ["Database", "Azure Cosmos DB for NoSQL", "Selesai"],
                ["Object Storage", "Azure Blob Storage raw-data", "Selesai"],
                ["Secrets", "Azure Key Vault + Cloudflare env", "Selesai"],
                ["Observability", "Application Insights", "Selesai"],
            ],
            [4.0 * cm, 7.0 * cm, 4.0 * cm],
        ),
        p("Endpoint Utama", "H2x"),
        table(
            [
                ["Method", "Endpoint", "Fungsi"],
                ["GET", "/api/hello", "Health check"],
                ["POST", "/api/register", "Registrasi user role user"],
                ["POST", "/api/login", "Login dan token sesi"],
                ["GET", "/api/me", "Validasi token"],
                ["GET", "/api/stats", "Statistik data sesuai role"],
                ["GET", "/api/data", "Data terbaru sesuai role"],
                ["POST", "/api/analyze", "Analisis kualitas data tanpa simpan"],
                ["POST", "/api/upload", "Upload JSON/CSV/XLSX/XLS"],
                ["GET", "/api/analytics", "Data science profiling dan chart"],
                ["GET", "/api/admin/users", "Admin-only daftar user"],
            ],
            [2.0 * cm, 4.8 * cm, 9.0 * cm],
        ),
        p("Data Processing", "H2x"),
        bullets(
            [
                "File JSON dapat berupa object tunggal atau array record.",
                "File CSV memakai baris pertama sebagai header.",
                "File XLSX dan XLS memakai sheet pertama dan baris pertama sebagai header.",
                "Batas upload adalah 5 MB dan 1.000 record per file.",
                "Backend melakukan profiling, quality check, cleaning opsional, klasifikasi sensor/log/generic, dan penyimpanan ke Cosmos DB.",
                "Record upload diberi owner_user_id sehingga user biasa hanya melihat data miliknya sendiri.",
            ]
        ),
        PageBreak(),
        p("Bukti UI Login dan Register", "H2x"),
        image(EVIDENCE / "ui-login.png", 15.8 * cm),
        image(EVIDENCE / "ui-register.png", 15.8 * cm),
        PageBreak(),
        p("Bukti Dashboard User", "H2x"),
        image(EVIDENCE / "ui-user-preview.png", 17.0 * cm),
        PageBreak(),
        p("Bukti Dashboard Admin", "H2x"),
        image(EVIDENCE / "ui-admin-preview.png", 17.0 * cm),
        PageBreak(),
    ]

    story += [
        p("Minggu 4 - Monitoring, Keamanan, Backup, dan Optimasi", "H1x"),
        p("Minggu keempat berfokus pada aspek operasional agar sistem tidak hanya berjalan, tetapi juga dapat diamati, diamankan, dan dikendalikan biayanya."),
        p("Monitoring dan Logging", "H2x"),
        table(
            [
                ["Aspek", "Implementasi", "Tujuan"],
                ["Application Insights", "Tersambung ke Azure Functions", "Request log, exception, latency"],
                ["Azure Monitor", "Metric alert direncanakan di Terraform lokal", "Alert operasional"],
                ["Log Analytics", "Workspace digunakan oleh Application Insights", "Query troubleshooting"],
                ["Dashboard Aplikasi", "Frontend menampilkan statistik, table, dan chart", "Monitoring data hasil proses"],
            ],
            [3.5 * cm, 6.0 * cm, 6.0 * cm],
        ),
        p("Alert Rule Minggu 4", "H2x"),
        table(
            [
                ["Alert", "Target", "Threshold"],
                ["Function 5xx Error", "Azure Function App", "HTTP 5xx lebih dari 5 dalam 5 menit"],
                ["Function Latency", "Azure Function App", "Average response time lebih dari 2 detik"],
                ["VM CPU High", "VM Web", "CPU rata-rata lebih dari 80 persen selama 5 menit"],
            ],
            [4.0 * cm, 5.0 * cm, 6.5 * cm],
        ),
        p("Security Baseline", "H2x"),
        table(
            [
                ["Area", "Kontrol Keamanan", "Status"],
                ["Frontend secret", "Browser hanya memanggil /api same-origin", "Selesai"],
                ["Function key", "Disimpan server-side di Cloudflare env", "Selesai"],
                ["Cosmos secret", "Disimpan di Azure Key Vault", "Selesai"],
                ["Password", "PBKDF2 hash, bukan plaintext", "Selesai"],
                ["Role access", "Register publik selalu role user", "Selesai"],
                ["Data isolation", "User hanya melihat data owner_user_id miliknya", "Selesai"],
                ["Repo hygiene", ".env, .tfvars, state, key, zip, AGENTS.md di-ignore", "Selesai"],
                ["VM SSH", "Perlu dibatasi ke IP admin final", "Rekomendasi"],
            ],
            [3.2 * cm, 8.2 * cm, 3.7 * cm],
        ),
        p("Backup dan Recovery", "H2x"),
        bullets(
            [
                "Cosmos DB memakai mekanisme backup platform Azure sesuai konfigurasi account.",
                "Blob Storage raw-data dapat menjadi sumber reprocessing jika data perlu dipulihkan.",
                "Source code dan dokumentasi tersimpan di GitHub.",
                "Simulasi recovery yang disarankan: upload file kecil, verifikasi Cosmos DB, export satu record sebagai bukti, lalu proses ulang file dari backup lokal/blob.",
            ]
        ),
        PageBreak(),
        p("Cost Awareness dan Optimasi", "H2x"),
        table(
            [
                ["Optimasi", "Dampak"],
                ["Cloudflare Pages untuk frontend", "Mengurangi kebutuhan compute Azure untuk static dashboard"],
                ["Azure Functions Consumption Plan", "Menghindari biaya backend idle"],
                ["Cosmos DB Serverless", "Cocok untuk traffic kecil/proyek dan menghindari RU provisioned idle"],
                ["Storage lifecycle policy", "Mengontrol retensi file mentah lama"],
                ["Matikan VM saat tidak demo", "Mengurangi biaya compute non-esensial"],
            ],
            [5.8 * cm, 9.8 * cm],
        ),
        p("Checklist Bukti Screenshot Portal", "H2x"),
        table(
            [
                ["Bukti", "Lokasi Portal", "Catatan"],
                ["Resource Group", "Azure Portal > Resource groups", "Tampilkan daftar resource"],
                ["VNet dan subnet", "Azure Portal > Virtual networks", "Bukti network Minggu 2"],
                ["NSG rules", "Azure Portal > Network security groups", "Mask IP admin bila ada"],
                ["Cosmos containers", "Azure Portal > Cosmos DB", "Jangan tampilkan key"],
                ["Blob raw-data", "Storage Account > Containers", "Jangan tampilkan access key"],
                ["Function App", "Azure Portal > Function App", "Jangan tampilkan function key"],
                ["Cloudflare custom domain", "Cloudflare Pages > Custom domains", "Jangan tampilkan token"],
                ["Application Insights", "Azure Portal > Application Insights", "Bukti monitoring"],
                ["Alert rules", "Azure Monitor > Alerts", "Mask email jika perlu"],
                ["Cost Management", "Azure Cost Management", "Breakdown biaya"],
                ["Defender for Cloud", "Azure Defender/Security posture", "Bukti audit keamanan"],
            ],
            [4.3 * cm, 5.8 * cm, 5.4 * cm],
        ),
        PageBreak(),
    ]

    story += [
        p("Kesimpulan", "H1x"),
        p("Berdasarkan roadmap Final Project Cloud Computing, pekerjaan Minggu 1 sampai Minggu 4 sudah memiliki dasar yang kuat. Minggu 1 lengkap dari sisi perencanaan dan arsitektur. Minggu 2 memiliki rancangan infrastruktur, jaringan, IAM, dan IaC. Minggu 3 sudah memiliki sistem end-to-end dengan frontend, proxy, backend, database, storage, login/register, upload, dan data science processing. Minggu 4 sudah memiliki baseline monitoring, security, backup, dan cost-awareness, tetapi masih memerlukan screenshot portal untuk bukti final."),
        p("Lampiran File Repository", "H2x"),
        table(
            [
                ["File/Folder", "Fungsi"],
                ["README.md", "Ringkasan project dan kesesuaian roadmap"],
                ["docs/week1-planning.md", "Deliverable Minggu 1"],
                ["docs/week2-infrastructure.md", "Deliverable Minggu 2"],
                ["docs/week3-core-services.md", "Deliverable Minggu 3"],
                ["docs/week4-monitoring-security-optimization.md", "Deliverable Minggu 4"],
                ["docs/evidence/", "Bukti screenshot aman untuk laporan"],
                ["src/backend/function_app.py", "Backend Azure Functions"],
                ["src/dashboard/", "Frontend dashboard"],
                ["functions/api/[[path]].js", "Cloudflare Pages Function proxy"],
                ["infra/", "Terraform lokal/private untuk resource Azure"],
            ],
            [5.8 * cm, 9.8 * cm],
        ),
        p("Catatan Keamanan Lampiran", "H2x"),
        p("Semua screenshot tambahan harus diperiksa sebelum dibagikan. Jangan menyertakan function key, Cloudflare API token, connection string, access key, password, file tfvars, atau tenant/subscription ID penuh jika tidak diperlukan."),
    ]

    return story


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.4 * cm,
        bottomMargin=1.6 * cm,
        title="Laporan Minggu 1-4 Kelompok 11",
        author="Kelompok 11",
    )
    doc.build(build(), onFirstPage=header_footer, onLaterPages=header_footer)
    print(OUT)


if __name__ == "__main__":
    main()
