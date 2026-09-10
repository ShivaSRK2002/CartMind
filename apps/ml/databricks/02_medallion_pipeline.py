# Databricks notebook source
# MAGIC %md
# MAGIC # CartMind AI — Medallion pipeline (Bronze → Silver → Gold)
# MAGIC
# MAGIC The `PostgreSQL + Databricks Data Pipeline` stage of the use-case
# MAGIC architecture. Reads the raw tables exported by
# MAGIC `01_export_from_postgres.py`, cleans and conforms them (Silver), then
# MAGIC builds the analytics/feature tables the Python ML engine and Power BI
# MAGIC consume (Gold).
# MAGIC
# MAGIC **Databricks (Free Edition / serverless):** import this file as a
# MAGIC notebook (Workspace ▸ Import). Create a Volume `cartmind` under
# MAGIC `workspace.default` and upload the five `*.parquet` files to its
# MAGIC `raw/` folder. Attach to *Default Interactive Compute* and Run All.
# MAGIC Gold lands as tables in `workspace.default.gold_*` and as CSVs in
# MAGIC `/Volumes/workspace/default/cartmind/out/` for download.
# MAGIC
# MAGIC **Locally:** `python 02_medallion_pipeline.py --input apps/ml/databricks/data --output apps/ml/databricks/data/out`

# COMMAND ----------

from __future__ import annotations

import argparse
import os

from pyspark.sql import DataFrame, SparkSession
from pyspark.sql import functions as F

RAW_TABLES = ["users", "products", "orders", "order_items", "events"]


def _in_databricks() -> bool:
    # `spark` is pre-injected into every Databricks notebook (classic and
    # serverless / Free Edition); the env var is only set on classic runtimes.
    return "spark" in globals() or "DATABRICKS_RUNTIME_VERSION" in os.environ


# COMMAND ----------
# MAGIC %md ## Spark session — reuse the Databricks one, or build a local Delta-enabled one


def get_spark() -> SparkSession:
    try:
        return spark  # type: ignore[name-defined]  # provided by Databricks (Delta is native there)
    except NameError:
        pass

    # Local run: plain Spark, no Delta (the local path writes CSV via pandas).
    # Windows/loopback: the JVM must reach the Python driver on localhost.
    os.environ.setdefault("SPARK_LOCAL_IP", "127.0.0.1")
    session = (
        SparkSession.builder.appName("cartmind-medallion")
        .master("local[*]")
        .config("spark.sql.shuffle.partitions", "4")
        .config("spark.ui.enabled", "false")
        .getOrCreate()
    )
    session.sparkContext.setLogLevel("ERROR")
    return session


# COMMAND ----------
# MAGIC %md ## Bronze — land raw parquet unchanged


def read_bronze(spark: SparkSession, input_path: str) -> dict[str, DataFrame]:
    return {
        name: spark.read.parquet(f"{input_path}/raw/{name}.parquet")
        for name in RAW_TABLES
    }


# COMMAND ----------
# MAGIC %md ## Silver — typed, de-duplicated, conformed


def build_silver(bronze: dict[str, DataFrame]) -> dict[str, DataFrame]:
    users = (
        bronze["users"]
        .dropDuplicates(["id"])
        .withColumn("created_at", F.to_timestamp("created_at"))
    )

    orders = (
        bronze["orders"]
        .dropDuplicates(["id"])
        .withColumn("total_amount", F.col("total_amount").cast("double"))
        .withColumn("created_at", F.to_timestamp("created_at"))
    )

    order_items = (
        bronze["order_items"]
        .dropDuplicates(["id"])
        .withColumn("quantity", F.col("quantity").cast("int"))
        .withColumn("unit_price", F.col("unit_price").cast("double"))
    )

    events = (
        bronze["events"]
        .dropDuplicates(["id"])
        .withColumn("occurred_at", F.to_timestamp("occurred_at"))
        .withColumn("product_id", F.get_json_object("payload", "$.productId"))
    )

    products = bronze["products"].dropDuplicates(["id"])

    return {
        "users": users,
        "products": products,
        "orders": orders,
        "order_items": order_items,
        "events": events,
        "paid_orders": orders.filter(F.col("status") == "paid"),
        "customers": users.filter(F.col("role") == "customer"),
    }


# COMMAND ----------
# MAGIC %md ## Gold — feature & analytics tables


def _event_count(events: DataFrame, event_type: str, alias: str) -> DataFrame:
    return (
        events.filter(F.col("event_type") == event_type)
        .groupBy("user_id")
        .agg(F.count("*").alias(alias))
    )


def build_gold(silver: dict[str, DataFrame]) -> dict[str, DataFrame]:
    customers = silver["customers"]
    paid = silver["paid_orders"]
    events = silver["events"]

    order_agg = paid.groupBy("user_id").agg(
        F.countDistinct("id").alias("order_count"),
        F.coalesce(F.sum("total_amount"), F.lit(0.0)).alias("lifetime_value"),
        F.max("created_at").alias("last_order_at"),
    )

    events_30d = (
        events.filter(F.col("occurred_at") >= F.date_sub(F.current_timestamp(), 30))
        .groupBy("user_id")
        .agg(F.count("*").alias("events_30d"))
    )

    counts = {
        "product_views": "product_viewed",
        "add_to_cart": "add_to_cart",
        "checkouts_started": "checkout_started",
        "payments": "payment_success",
        "checkout_abandoned": "checkout_abandoned",
        "wishlist_adds": "wishlist_add",
    }

    features = customers.select(
        F.col("id").alias("user_id"), "name", "email", "created_at"
    )
    features = features.join(order_agg, "user_id", "left").join(events_30d, "user_id", "left")
    for alias, event_type in counts.items():
        features = features.join(_event_count(events, event_type, alias), "user_id", "left")

    zero_cols = [
        "order_count",
        "lifetime_value",
        "events_30d",
        *counts.keys(),
    ]
    for col in zero_cols:
        features = features.withColumn(col, F.coalesce(F.col(col), F.lit(0)))

    features = (
        features.withColumn(
            "days_since_last_order",
            F.when(
                F.col("last_order_at").isNull(), F.lit(365.0)
            ).otherwise(F.datediff(F.current_timestamp(), F.col("last_order_at")).cast("double")),
        )
        .withColumn(
            "days_since_signup",
            F.datediff(F.current_timestamp(), F.col("created_at")).cast("double"),
        )
        .withColumn(
            "cart_to_view_ratio",
            F.col("add_to_cart") / F.greatest(F.col("product_views"), F.lit(1)),
        )
        .withColumn(
            "checkout_to_cart_ratio",
            F.col("checkouts_started") / F.greatest(F.col("add_to_cart"), F.lit(1)),
        )
        .drop("last_order_at", "created_at")
    )

    revenue_daily = (
        paid.withColumn("day", F.to_date("created_at"))
        .groupBy("day")
        .agg(
            F.sum("total_amount").alias("revenue"),
            F.countDistinct("id").alias("orders"),
        )
        .withColumn("avg_order_value", F.col("revenue") / F.greatest(F.col("orders"), F.lit(1)))
        .orderBy("day")
    )

    event_funnel = (
        events.withColumn("day", F.to_date("occurred_at"))
        .groupBy("day", "event_type")
        .agg(F.count("*").alias("event_count"))
        .orderBy("day", "event_type")
    )

    oi = silver["order_items"].join(
        paid.select(F.col("id").alias("order_id"), "user_id"), "order_id"
    )
    purchases = oi.select("user_id", "product_id").withColumn("weight", F.lit(5))
    carts = (
        events.filter((F.col("event_type") == "add_to_cart") & F.col("product_id").isNotNull())
        .select("user_id", "product_id")
        .withColumn("weight", F.lit(3))
    )
    views = (
        events.filter((F.col("event_type") == "product_viewed") & F.col("product_id").isNotNull())
        .select("user_id", "product_id")
        .withColumn("weight", F.lit(1))
    )
    product_interactions = (
        purchases.unionByName(carts)
        .unionByName(views)
        .filter(F.col("user_id").isNotNull() & F.col("product_id").isNotNull())
        .groupBy("user_id", "product_id")
        .agg(F.sum("weight").alias("weight"))
    )

    return {
        "gold_user_features": features,
        "gold_revenue_daily": revenue_daily,
        "gold_event_funnel": event_funnel,
        "gold_product_interactions": product_interactions,
    }


# COMMAND ----------
# MAGIC %md ## Write — Delta tables + single-file CSVs for download


def write_outputs(gold: dict[str, DataFrame], output_path: str, engine: str = "spark") -> None:
    if engine == "databricks":
        # Free Edition / serverless: managed Delta tables for SQL + Power BI,
        # plus one CSV per table in the Volume for download / loading back.
        try:
            os.makedirs(output_path, exist_ok=True)
        except OSError:
            pass
        for name, df in gold.items():
            df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable(
                f"{DATABRICKS_SCHEMA}.{name}"
            )
            try:
                df.toPandas().to_csv(f"{output_path}/{name}.csv", index=False)
                extra = f"+ {name}.csv"
            except OSError:
                extra = "(CSV skipped — download from the table grid below)"
            print(f"  {DATABRICKS_SCHEMA}.{name:<26} -> table {extra}")
        return

    # Local: Spark's Hadoop file writer needs winutils.exe on Windows, so
    # materialize via the driver instead. One CSV per table.
    import pathlib

    csv_dir = pathlib.Path(output_path) / "gold_csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    for name, df in gold.items():
        pdf = df.toPandas()
        pdf.to_csv(csv_dir / f"{name}.csv", index=False)
        print(f"  {name:<26} {len(pdf):>6} rows -> gold_csv/{name}.csv")


# COMMAND ----------
# MAGIC %md ## Run


def run_pipeline(
    spark: SparkSession, input_path: str, output_path: str, engine: str = "pandas"
) -> dict[str, DataFrame]:
    bronze = read_bronze(spark, input_path)
    silver = build_silver(bronze)
    gold = build_gold(silver)
    write_outputs(gold, output_path, engine=engine)
    return gold


# COMMAND ----------

# Databricks Free Edition — Unity Catalog Volume + schema. Change these if
# you used a different catalog/schema/volume name.
DATABRICKS_SCHEMA = "workspace.default"
VOLUME_BASE = "/Volumes/workspace/default/cartmind"

if _in_databricks():
    run_pipeline(spark, f"{VOLUME_BASE}", f"{VOLUME_BASE}/out", engine="databricks")  # noqa: F821
    display(spark.table(f"{DATABRICKS_SCHEMA}.gold_user_features"))  # noqa: F821


# COMMAND ----------

if __name__ == "__main__" and not _in_databricks():
    parser = argparse.ArgumentParser(description="CartMind medallion pipeline (local Spark).")
    parser.add_argument("--input", required=True, help="dir containing raw/<table>.parquet")
    parser.add_argument("--output", required=True, help="dir for gold_csv/ output")
    parser.add_argument(
        "--engine",
        choices=["pandas", "databricks"],
        default="pandas",
        help="pandas (default) avoids the winutils.exe requirement on Windows",
    )
    args = parser.parse_args()

    session = get_spark()
    run_pipeline(session, args.input, args.output, engine=args.engine)
    session.stop()
