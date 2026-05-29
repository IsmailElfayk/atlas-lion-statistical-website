"""
Production scheduler — runs ingestion pipelines on a cron-like schedule.
Run with: python scheduler.py
"""

import logging
import schedule
import time

from fetch_sofascore import run as run_sofascore
from fetch_transfermarkt import run as run_transfermarkt

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

schedule.every(6).hours.do(run_sofascore)
schedule.every().monday.at("03:00").do(run_transfermarkt)

if __name__ == "__main__":
    log.info("Scheduler started")
    run_sofascore()
    while True:
        schedule.run_pending()
        time.sleep(60)
