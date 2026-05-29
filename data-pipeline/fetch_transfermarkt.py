"""
Stub: scrape Transfermarkt market values for tracked players.

In production this would parse Transfermarkt HTML (respecting robots.txt and
rate limits), extract market value history, and upsert Player.marketValueEur.
"""

import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def fetch_market_value(transfermarkt_id: int) -> dict | None:
    """Stub — returns None. Replace with HTML scrape logic."""
    log.info(f"[stub] would fetch market value for TM id {transfermarkt_id}")
    return None


def run() -> None:
    log.info("Starting Transfermarkt ingestion pipeline (stub)")
    sample_ids = [188858, 242246, 290325]  # Hakimi, En-Nesyri, Saïss
    for tm_id in sample_ids:
        result = fetch_market_value(tm_id)
        if result:
            log.info(f"Would update market value: {result}")
    log.info("Pipeline complete")


if __name__ == "__main__":
    run()
