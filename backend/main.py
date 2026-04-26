"""
OpenMetadata Dashboard Backend
FastAPI server that connects to OpenMetadata API and exposes
table freshness, data quality, and pipeline status endpoints.
"""

import os
import json
import random
from datetime import datetime, timedelta
from typing import Optional
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI(
    title="OpenMetadata Dashboard API",
    description="Backend for OpenMetadata Data Observability Dashboard",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenMetadata config from env
OM_HOST = os.getenv("OPENMETADATA_HOST", "http://localhost:8585")
OM_TOKEN = os.getenv("OPENMETADATA_TOKEN", "")
OM_DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {OM_TOKEN}" if OM_TOKEN else "",
}


# ─── Demo Data Generator ───────────────────────────────────────────────────────

def _rand_dt(hours_ago_min=1, hours_ago_max=120) -> str:
    delta = timedelta(hours=random.uniform(hours_ago_min, hours_ago_max))
    return (datetime.utcnow() - delta).isoformat() + "Z"


def generate_demo_tables():
    tables = [
        {"name": "orders", "schema": "ecommerce", "database": "prod_db"},
        {"name": "customers", "schema": "ecommerce", "database": "prod_db"},
        {"name": "products", "schema": "catalog", "database": "prod_db"},
        {"name": "sessions", "schema": "analytics", "database": "analytics_db"},
        {"name": "events", "schema": "analytics", "database": "analytics_db"},
        {"name": "inventory", "schema": "warehouse", "database": "ops_db"},
        {"name": "returns", "schema": "ecommerce", "database": "prod_db"},
        {"name": "payments", "schema": "finance", "database": "finance_db"},
        {"name": "subscriptions", "schema": "billing", "database": "finance_db"},
        {"name": "user_segments", "schema": "ml", "database": "ml_db"},
        {"name": "recommendations", "schema": "ml", "database": "ml_db"},
        {"name": "ad_impressions", "schema": "marketing", "database": "analytics_db"},
    ]

    result = []
    for t in tables:
        hrs = random.uniform(0.5, 96)
        if hrs < 4:
            freshness = "fresh"
        elif hrs < 24:
            freshness = "stale"
        else:
            freshness = "critical"

        row_count = random.randint(1000, 10_000_000)
        result.append({
            "id": f"{t['database']}.{t['schema']}.{t['name']}",
            "name": t["name"],
            "schema": t["schema"],
            "database": t["database"],
            "fullyQualifiedName": f"local_mysql.{t['database']}.{t['schema']}.{t['name']}",
            "lastUpdated": _rand_dt(hours_ago_min=hrs, hours_ago_max=hrs + 0.01),
            "hoursAgo": round(hrs, 1),
            "freshnessStatus": freshness,
            "rowCount": row_count,
            "columnCount": random.randint(5, 40),
            "owner": random.choice(["data-eng", "analytics", "ml-team", "finance-eng"]),
            "tags": random.sample(["pii", "sensitive", "core", "marketing", "finance", "experimental"], k=random.randint(0, 2)),
        })
    return result


def generate_demo_tests(tables):
    test_types = [
        "columnValuesToBeBetween",
        "columnValuesNotToBeNull",
        "tableRowCountToBeBetween",
        "columnValueLengthsToBeBetween",
        "columnValuesToBeUnique",
        "tableColumnCountToBeBetween",
        "columnValuesToBeInSet",
    ]
    results = []
    for t in tables:
        n_tests = random.randint(2, 6)
        for i in range(n_tests):
            status = random.choices(["Success", "Failed", "Aborted"], weights=[70, 20, 10])[0]
            results.append({
                "id": f"{t['id']}_test_{i}",
                "tableId": t["id"],
                "tableName": t["name"],
                "testName": random.choice(test_types),
                "status": status,
                "passedRows": random.randint(900, 1000) if status == "Success" else random.randint(0, 500),
                "failedRows": 0 if status == "Success" else random.randint(1, 200),
                "lastRun": _rand_dt(1, 48),
                "parameterValues": {"minValue": 0, "maxValue": 1000000},
            })
    return results


def generate_demo_pipelines():
    pipelines = [
        {"name": "orders_ingestion", "service": "Airbyte", "type": "ingestion"},
        {"name": "customers_profiling", "service": "OpenMetadata", "type": "profiler"},
        {"name": "analytics_dbt_run", "service": "dbt", "type": "lineage"},
        {"name": "ml_feature_pipeline", "service": "Prefect", "type": "ingestion"},
        {"name": "finance_etl", "service": "Airflow", "type": "ingestion"},
        {"name": "marketing_sync", "service": "Fivetran", "type": "ingestion"},
        {"name": "data_quality_tests", "service": "OpenMetadata", "type": "test"},
        {"name": "metadata_ingestion", "service": "OpenMetadata", "type": "ingestion"},
    ]
    result = []
    for p in pipelines:
        status = random.choices(["successful", "failed", "running", "queued"], weights=[60, 15, 15, 10])[0]
        result.append({
            "id": p["name"],
            "name": p["name"].replace("_", " ").title(),
            "service": p["service"],
            "pipelineType": p["type"],
            "status": status,
            "startTime": _rand_dt(1, 12),
            "endTime": _rand_dt(0.1, 1) if status not in ("running", "queued") else None,
            "duration": round(random.uniform(30, 3600), 0),
            "records": random.randint(100, 500000),
        })
    return result


# ─── OpenMetadata API Client ───────────────────────────────────────────────────

async def om_get(path: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"{OM_HOST}/api/v1{path}", headers=HEADERS)
        resp.raise_for_status()
        return resp.json()


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "OpenMetadata Dashboard API", "demo_mode": OM_DEMO_MODE}


@app.get("/api/health")
def health():
    return {"status": "ok", "demo_mode": OM_DEMO_MODE, "om_host": OM_HOST}


@app.get("/api/tables/freshness")
async def table_freshness(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None, description="fresh|stale|critical"),
    database: Optional[str] = Query(None),
):
    """Returns table freshness data (last updated time)."""
    if OM_DEMO_MODE:
        tables = generate_demo_tables()
    else:
        try:
            data = await om_get(f"/tables?limit={limit}&include=all")
            raw = data.get("data", [])
            tables = []
            for t in raw:
                updated = t.get("updatedAt", t.get("createdAt", 0))
                if isinstance(updated, (int, float)):
                    updated_dt = datetime.utcfromtimestamp(updated / 1000)
                else:
                    updated_dt = datetime.fromisoformat(str(updated).replace("Z", ""))
                hrs = (datetime.utcnow() - updated_dt).total_seconds() / 3600
                if hrs < 4:
                    freshness = "fresh"
                elif hrs < 24:
                    freshness = "stale"
                else:
                    freshness = "critical"
                tables.append({
                    "id": t.get("id"),
                    "name": t.get("name"),
                    "schema": t.get("databaseSchema", {}).get("name", ""),
                    "database": t.get("database", {}).get("name", ""),
                    "fullyQualifiedName": t.get("fullyQualifiedName"),
                    "lastUpdated": updated_dt.isoformat() + "Z",
                    "hoursAgo": round(hrs, 1),
                    "freshnessStatus": freshness,
                    "rowCount": t.get("profile", {}).get("rowCount", 0),
                    "columnCount": t.get("columns", []),
                    "owner": t.get("owner", {}).get("name", "unknown"),
                    "tags": [tag.get("tagFQN", "") for tag in t.get("tags", [])],
                })
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"OpenMetadata error: {str(e)}")

    if status:
        tables = [t for t in tables if t["freshnessStatus"] == status]
    if database:
        tables = [t for t in tables if t["database"] == database]

    summary = {
        "total": len(tables),
        "fresh": sum(1 for t in tables if t["freshnessStatus"] == "fresh"),
        "stale": sum(1 for t in tables if t["freshnessStatus"] == "stale"),
        "critical": sum(1 for t in tables if t["freshnessStatus"] == "critical"),
    }
    return {"tables": tables, "summary": summary}


@app.get("/api/tests/results")
async def test_results(
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None, description="Success|Failed|Aborted"),
):
    """Returns data quality test results."""
    if OM_DEMO_MODE:
        tables = generate_demo_tables()
        tests = generate_demo_tests(tables)
    else:
        try:
            data = await om_get(f"/dataQuality/testCases?limit={limit}&include=all")
            raw = data.get("data", [])
            tests = []
            for tc in raw:
                result = tc.get("testCaseResult", {})
                tests.append({
                    "id": tc.get("id"),
                    "tableId": tc.get("entityLink", "").split("::")[1] if "::" in tc.get("entityLink", "") else "",
                    "tableName": tc.get("entityLink", "").split("::")[-2] if "::" in tc.get("entityLink", "") else "",
                    "testName": tc.get("testDefinition", {}).get("name", tc.get("name")),
                    "status": result.get("testCaseStatus", "Unknown"),
                    "passedRows": result.get("passedRows", 0),
                    "failedRows": result.get("failedRows", 0),
                    "lastRun": result.get("timestamp", ""),
                    "parameterValues": tc.get("parameterValues", []),
                })
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"OpenMetadata error: {str(e)}")

    if status:
        tests = [t for t in tests if t["status"] == status]

    summary = {
        "total": len(tests),
        "passed": sum(1 for t in tests if t["status"] == "Success"),
        "failed": sum(1 for t in tests if t["status"] == "Failed"),
        "aborted": sum(1 for t in tests if t["status"] == "Aborted"),
        "passRate": round(sum(1 for t in tests if t["status"] == "Success") / max(len(tests), 1) * 100, 1),
    }
    return {"tests": tests, "summary": summary}


@app.get("/api/pipelines/status")
async def pipeline_status(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
):
    """Returns ingestion/ETL pipeline status."""
    if OM_DEMO_MODE:
        pipelines = generate_demo_pipelines()
    else:
        try:
            data = await om_get(f"/services/ingestionPipelines?limit={limit}&include=all")
            raw = data.get("data", [])
            pipelines = []
            for p in raw:
                runs = p.get("pipelineStatuses", {})
                latest = runs.get("runs", [{}])[0] if runs.get("runs") else {}
                pipelines.append({
                    "id": p.get("id"),
                    "name": p.get("displayName", p.get("name")),
                    "service": p.get("service", {}).get("name", ""),
                    "pipelineType": p.get("pipelineType", ""),
                    "status": latest.get("pipelineState", "unknown"),
                    "startTime": latest.get("startDate", ""),
                    "endTime": latest.get("endDate", ""),
                    "duration": latest.get("duration", 0),
                    "records": latest.get("records", 0),
                })
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"OpenMetadata error: {str(e)}")

    if status:
        pipelines = [p for p in pipelines if p["status"] == status]

    summary = {
        "total": len(pipelines),
        "successful": sum(1 for p in pipelines if p["status"] == "successful"),
        "failed": sum(1 for p in pipelines if p["status"] == "failed"),
        "running": sum(1 for p in pipelines if p["status"] == "running"),
        "queued": sum(1 for p in pipelines if p["status"] == "queued"),
    }
    return {"pipelines": pipelines, "summary": summary}


@app.get("/api/overview")
async def overview():
    """Returns aggregated overview for the dashboard header."""
    tables_resp = await table_freshness(limit=200, status=None, database=None)
    tests_resp = await test_results(limit=500, status=None)
    pipelines_resp = await pipeline_status(limit=200, status=None)
    return {
        "tables": tables_resp["summary"],
        "tests": tests_resp["summary"],
        "pipelines": pipelines_resp["summary"],
        "generatedAt": datetime.utcnow().isoformat() + "Z",
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
