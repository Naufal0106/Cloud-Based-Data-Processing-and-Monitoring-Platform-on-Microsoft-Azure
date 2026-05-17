from __future__ import annotations

import json
import shutil
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "evidence"
RG = "RG-Kelompok11"
FUNC = "func-backend-monitoring-k11"
VM = "VM-Web-Kelompok11"
COSMOS = "cosmos-kelompok11-monitoring"
DB = "db-platform-monitoring"
STORAGE = "stfuncmonitoringk11"
AZ = shutil.which("az") or shutil.which("az.cmd") or "az.cmd"


def az(args: list[str], default: Any = None) -> Any:
    command = [AZ, *args, "--output", "json"]
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            cwd=ROOT,
        )
    except subprocess.CalledProcessError:
        return default
    text = result.stdout.strip()
    if not text:
        return default
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return default


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


TITLE = font(34, True)
SUBTITLE = font(18)
HEAD = font(22, True)
BODY = font(18)
SMALL = font(15)
MONO = font(16)


def draw_card(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], title: str, rows: list[tuple[str, str]]) -> None:
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=18, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((x1 + 24, y1 + 20), title, fill="#0f172a", font=HEAD)
    y = y1 + 64
    for label, value in rows:
        draw.text((x1 + 24, y), label, fill="#475569", font=SMALL)
        draw.text((x1 + 250, y), value, fill="#0f172a", font=BODY)
        y += 34


def canvas(title: str, subtitle: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (1600, 1000), "#f8fafc")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, 1600, 120), fill="#0f172a")
    draw.text((48, 28), title, fill="#ffffff", font=TITLE)
    draw.text((50, 78), subtitle, fill="#cbd5e1", font=SUBTITLE)
    stamp = datetime.now(timezone.utc).strftime("Generated %Y-%m-%d %H:%M UTC")
    draw.text((1240, 82), stamp, fill="#cbd5e1", font=SMALL)
    return img, draw


def save(img: Image.Image, name: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    img.save(path)
    return path


def summarize_metric(metric: Any, key: str) -> str:
    if not metric or not isinstance(metric, list):
        return "No recent data"
    for item in metric:
        if item.get("metric") == key:
            data = item.get("data") or []
            if not data:
                return "No recent data"
            latest = data[-1]
            for field in ("total", "average", "count", "maximum"):
                if latest.get(field) is not None:
                    value = latest[field]
                    return f"{value:.3f}" if isinstance(value, float) else str(value)
    return "No recent data"


def evidence_application_insights() -> Path:
    component = az(
        [
            "resource",
            "show",
            "--resource-group",
            RG,
            "--name",
            FUNC,
            "--resource-type",
            "microsoft.insights/components",
            "--query",
            "{name:name,type:type,location:location,kind:kind,appType:properties.Application_Type,provisioningState:properties.provisioningState}",
        ],
        {},
    )
    func = az(
        [
            "functionapp",
            "show",
            "--name",
            FUNC,
            "--resource-group",
            RG,
            "--query",
            "{name:name,state:state,httpsOnly:httpsOnly,kind:kind,location:location,hostNames:hostNames}",
        ],
        {},
    )
    func_id = az(["functionapp", "show", "-g", RG, "-n", FUNC, "--query", "id"], "")
    metrics_total = az(
        [
            "monitor",
            "metrics",
            "list",
            "--resource",
            str(func_id),
            "--metric",
            "Requests,Http5xx",
            "--interval",
            "PT1H",
            "--aggregation",
            "Total",
            "--query",
            "value[].{metric:name.value,unit:unit,data:timeseries[0].data[-5:]}",
        ],
        [],
    )
    metrics_avg = az(
        [
            "monitor",
            "metrics",
            "list",
            "--resource",
            str(func_id),
            "--metric",
            "AverageResponseTime",
            "--interval",
            "PT1H",
            "--aggregation",
            "Average",
            "--query",
            "value[].{metric:name.value,unit:unit,data:timeseries[0].data[-5:]}",
        ],
        [],
    )
    vm_id = az(["vm", "show", "-g", RG, "-n", VM, "--query", "id"], "")
    vm_cpu = az(
        [
            "monitor",
            "metrics",
            "list",
            "--resource",
            str(vm_id),
            "--metric",
            "Percentage CPU",
            "--interval",
            "PT1H",
            "--aggregation",
            "Average",
            "--query",
            "value[].{metric:name.value,unit:unit,data:timeseries[0].data[-5:]}",
        ],
        [],
    )

    img, draw = canvas("Week 4 Evidence - Monitoring", "Azure Application Insights and metrics snapshot")
    draw_card(
        draw,
        (48, 160, 760, 430),
        "Application Insights",
        [
            ("Name", str(component.get("name", "-"))),
            ("Location", str(component.get("location", "-"))),
            ("App type", str(component.get("appType", "-"))),
            ("Provisioning", str(component.get("provisioningState", "-"))),
        ],
    )
    draw_card(
        draw,
        (820, 160, 1552, 430),
        "Function App",
        [
            ("Name", str(func.get("name", "-"))),
            ("State", str(func.get("state", "-"))),
            ("Kind", str(func.get("kind", "-"))),
            ("Host", ", ".join(func.get("hostNames") or ["-"])),
        ],
    )
    draw_card(
        draw,
        (48, 480, 1552, 830),
        "Latest Metrics",
        [
            ("Requests total", summarize_metric(metrics_total, "Requests")),
            ("HTTP 5xx total", summarize_metric(metrics_total, "Http5xx")),
            ("Avg response time", f"{summarize_metric(metrics_avg, 'AverageResponseTime')} seconds"),
            ("VM avg CPU", f"{summarize_metric(vm_cpu, 'Percentage CPU')} percent"),
        ],
    )
    draw.text((54, 888), "Source: Azure CLI sanitized output. No function key, token, access key, or connection string shown.", fill="#64748b", font=SMALL)
    return save(img, "week4-application-insights-metrics.png")


def evidence_alerts() -> Path:
    alerts = az(
        [
            "monitor",
            "metrics",
            "alert",
            "list",
            "--resource-group",
            RG,
            "--query",
            "[].{name:name,enabled:enabled,severity:severity,description:description,windowSize:windowSize,evaluationFrequency:evaluationFrequency}",
        ],
        [],
    )
    groups = az(
        [
            "monitor",
            "action-group",
            "list",
            "--resource-group",
            RG,
            "--query",
            "[].{name:name,enabled:enabled,groupShortName:groupShortName}",
        ],
        [],
    )
    img, draw = canvas("Week 4 Evidence - Alerting", "Azure Monitor action group and metric alert rules")
    draw_card(
        draw,
        (48, 155, 1552, 310),
        "Action Groups",
        [(item.get("name", "-"), f"enabled={item.get('enabled')} shortName={item.get('groupShortName')}") for item in groups],
    )
    draw.rounded_rectangle((48, 350, 1552, 875), radius=18, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((72, 374), "Metric Alerts", fill="#0f172a", font=HEAD)
    headers = ["Alert name", "Enabled", "Severity", "Window", "Evaluation", "Description"]
    xs = [72, 450, 575, 700, 835, 1020]
    for x, h in zip(xs, headers):
        draw.text((x, 424), h, fill="#0f766e", font=SMALL)
    y = 464
    for alert in alerts:
        values = [
            alert.get("name", "-"),
            str(alert.get("enabled", "-")),
            str(alert.get("severity", "-")),
            str(alert.get("windowSize", "-")),
            str(alert.get("evaluationFrequency", "-")),
            alert.get("description", "-"),
        ]
        for x, value in zip(xs, values):
            draw.text((x, y), str(value)[:55], fill="#0f172a", font=SMALL)
        y += 48
    draw.text((54, 912), "Source: Azure CLI sanitized output. Notification email is intentionally not displayed.", fill="#64748b", font=SMALL)
    return save(img, "week4-alert-rules-action-group.png")


def evidence_data_backup() -> Path:
    cosmos = az(
        [
            "cosmosdb",
            "show",
            "--name",
            COSMOS,
            "--resource-group",
            RG,
            "--query",
            "{name:name,kind:kind,locations:locations[].locationName,consistency:consistencyPolicy.defaultConsistencyLevel,backupPolicy:backupPolicy.type,publicNetworkAccess:publicNetworkAccess,provisioningState:provisioningState}",
        ],
        {},
    )
    containers = az(
        [
            "cosmosdb",
            "sql",
            "container",
            "list",
            "--account-name",
            COSMOS,
            "--resource-group",
            RG,
            "--database-name",
            DB,
            "--query",
            "[].{name:name,partitionKey:resource.partitionKey.paths}",
        ],
        [],
    )
    storage = az(
        [
            "storage",
            "container-rm",
            "list",
            "--storage-account",
            STORAGE,
            "--resource-group",
            RG,
            "--query",
            "[].{name:name,publicAccess:properties.publicAccess,deleted:properties.deleted}",
        ],
        [],
    )
    img, draw = canvas("Week 4 Evidence - Backup and Data", "Cosmos DB backup policy and Blob Storage containers")
    draw_card(
        draw,
        (48, 160, 760, 440),
        "Cosmos DB",
        [
            ("Name", str(cosmos.get("name", "-"))),
            ("Location", ", ".join(cosmos.get("locations") or ["-"])),
            ("Consistency", str(cosmos.get("consistency", "-"))),
            ("Backup policy", str(cosmos.get("backupPolicy", "-"))),
            ("Provisioning", str(cosmos.get("provisioningState", "-"))),
        ],
    )
    rows = []
    for item in containers:
        rows.append((item.get("name", "-"), ", ".join(item.get("partitionKey") or ["-"])))
    draw_card(draw, (820, 160, 1552, 440), "Cosmos Containers", rows)
    draw.rounded_rectangle((48, 490, 1552, 835), radius=18, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((72, 516), f"Storage Account Containers - {STORAGE}", fill="#0f172a", font=HEAD)
    y = 566
    for item in storage:
        access = item.get("publicAccess") or "private"
        draw.text((72, y), item.get("name", "-"), fill="#0f172a", font=BODY)
        draw.text((470, y), f"publicAccess={access}", fill="#475569", font=BODY)
        y += 36
    draw.text((54, 900), "Source: Azure CLI sanitized output. Access keys and connection strings are not displayed.", fill="#64748b", font=SMALL)
    return save(img, "week4-cosmos-storage-backup.png")


def evidence_security_cost() -> Path:
    security = az(["security", "pricing", "list", "--query", "value[].{name:name,pricingTier:pricingTier}"], [])
    usage = az(
        [
            "consumption",
            "usage",
            "list",
            "--start-date",
            "2026-05-01",
            "--end-date",
            "2026-05-17",
            "--query",
            "[].{service:consumedService,resource:instanceName,cost:pretaxCost,currency:currency}",
        ],
        [],
    )
    rg_usage = []
    for item in usage or []:
        resource = str(item.get("resource", "")).lower()
        if "rg-kelompok11" in resource or "rg_kelompok11" in resource:
            rg_usage.append(item)
    service_counts = Counter(str(item.get("service", "Unknown")) for item in rg_usage)
    selected_security = [item for item in security if item.get("name") in {"VirtualMachines", "AppServices", "StorageAccounts", "KeyVaults", "CosmosDbs", "CloudPosture", "FoundationalCspm"}]

    img, draw = canvas("Week 4 Evidence - Security and Cost", "Defender for Cloud pricing status and Cost Management usage")
    draw.rounded_rectangle((48, 160, 760, 820), radius=18, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((72, 188), "Defender for Cloud / Security Pricing", fill="#0f172a", font=HEAD)
    y = 242
    for item in selected_security:
        draw.text((72, y), str(item.get("name", "-")), fill="#0f172a", font=BODY)
        draw.text((440, y), str(item.get("pricingTier", "-")), fill="#475569", font=BODY)
        y += 42

    draw.rounded_rectangle((820, 160, 1552, 820), radius=18, fill="#ffffff", outline="#cbd5e1", width=2)
    draw.text((844, 188), "Cost Management Usage - RG-Kelompok11", fill="#0f172a", font=HEAD)
    y = 242
    if service_counts:
        for service, count in service_counts.most_common(10):
            draw.text((844, y), service, fill="#0f172a", font=BODY)
            draw.text((1300, y), f"{count} usage rows", fill="#475569", font=BODY)
            y += 42
    else:
        draw.text((844, y), "No usage rows returned for RG-Kelompok11", fill="#0f172a", font=BODY)
    draw.text((844, 724), "Note: Azure for Students/Consumption API returned cost fields as None in CLI.", fill="#64748b", font=SMALL)
    draw.text((54, 900), "Source: Azure CLI sanitized output. Subscription IDs, tenant IDs, and billing identifiers are omitted.", fill="#64748b", font=SMALL)
    return save(img, "week4-security-cost-management.png")


def main() -> None:
    outputs = [
        evidence_application_insights(),
        evidence_alerts(),
        evidence_data_backup(),
        evidence_security_cost(),
    ]
    for path in outputs:
        print(path)


if __name__ == "__main__":
    main()
