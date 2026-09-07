"""Item-item collaborative filtering for the recommendation engine.

Builds a user-item interaction matrix (view=1, cart=3, purchase=5) from live
Postgres data and computes cosine similarity between items — real
collaborative filtering, as opposed to the co-purchase/category heuristics
in apps/api/src/lib/recommendations.ts (which remain as the cold-start
fallback when this hasn't been run or a product has no interactions yet).
"""

from __future__ import annotations

import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

from .features_live import fetch_product_interactions


def compute_product_similarity(conn, top_k: int = 8) -> pd.DataFrame:
    interactions = fetch_product_interactions(conn)
    if interactions.empty:
        return pd.DataFrame(columns=["product_id", "similar_product_id", "similarity"])

    matrix = interactions.pivot_table(
        index="user_id", columns="product_id", values="weight", aggfunc="sum", fill_value=0
    )

    if matrix.shape[1] < 2:
        return pd.DataFrame(columns=["product_id", "similar_product_id", "similarity"])

    similarity = cosine_similarity(matrix.T.values)
    product_ids = matrix.columns.to_list()

    records = []
    for i, product_id in enumerate(product_ids):
        scores = [(product_ids[j], similarity[i, j]) for j in range(len(product_ids)) if j != i]
        scores.sort(key=lambda pair: pair[1], reverse=True)
        for similar_id, score in scores[:top_k]:
            if score <= 0:
                continue
            records.append({"product_id": product_id, "similar_product_id": similar_id, "similarity": round(float(score), 4)})

    return pd.DataFrame(records)
