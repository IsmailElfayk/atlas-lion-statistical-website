"""
Stub: fetch Sofascore match ratings for tracked Moroccan players.

In production this would:
1. Iterate over tracked players (from MongoDB)
2. Hit the Sofascore unofficial API for each recent match
3. Upsert Rating documents into MongoDB
4. Invalidate Redis cache keys for affected players

No live calls are made in this stub.
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/atlas_lions")
SOFASCORE_BASE = "https://api.sofascore.com/api/v1"

# Moroccan players tracked by Sofascore ID (example IDs)
TRACKED_PLAYERS = [
    {"name": "Achraf Hakimi",   "sofascoreId": 816027},
    {"name": "Romain Saïss",    "sofascoreId": 132950},
    {"name": "Youssef En-Nesyri","sofascoreId": 839956},
]


def fetch_player_ratings(sofascore_id: int, n_matches: int = 10) -> list[dict]:
    """Stub — returns empty list. Replace with real Sofascore API call."""
    log.info(f"[stub] would fetch last {n_matches} ratings for player {sofascore_id}")
    return []


def upsert_ratings(player_doc: dict, ratings: list[dict]) -> None:
    """Stub — would upsert Rating documents into MongoDB."""
    log.info(f"[stub] would upsert {len(ratings)} ratings for {player_doc['name']}")


def run() -> None:
    log.info("Starting Sofascore ingestion pipeline (stub)")
    for player in TRACKED_PLAYERS:
        ratings = fetch_player_ratings(player["sofascoreId"])
        upsert_ratings(player, ratings)
    log.info("Pipeline complete")


if __name__ == "__main__":
    run()
