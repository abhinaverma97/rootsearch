import logging
import os
from typing import List

from apscheduler.schedulers.background import BackgroundScheduler

from db_manager import ArchiveDB
from ingestdata import ingest_data
from analysis import analyze_data


class SchedulerService:
    """Scheduler that periodically runs the ingestion + analysis pipeline."""

    def __init__(self, interval_minutes: int = 60):
        self._logger = logging.getLogger("scheduler_service")
        self.interval_minutes = interval_minutes
        self._scheduler = BackgroundScheduler()
        self._job = None

    def start(self):
        if not self._scheduler.running:
            # Schedule a periodic job to run analysis for all boards
            self._job = self._scheduler.add_job(self._run_analysis_once, "interval", minutes=self.interval_minutes, next_run_time=None)

            # Schedule a daily job to compute and save board stats for frontend use
            try:
                from board_stats import get_all_boards_stats
                # Run once every 24 hours at midnight
                self._scheduler.add_job(get_all_boards_stats, "cron", hour=0, minute=0)
                self._logger.info("Scheduled daily board stats generation (Midnight)")
            except Exception:
                self._logger.exception("Failed to schedule daily board stats generation")

            self._scheduler.start()
            self._logger.info("Scheduler started: analysis every %s minutes", self.interval_minutes)

    def shutdown(self):
        if self._scheduler.running:
            self._scheduler.shutdown(wait=False)
        self._logger.info("Scheduler stopped")

    def run_analysis_once(self):
        # Public trigger for one-off runs
        self._run_analysis_once()

    def _run_analysis_once(self):
        try:
            from key_rotator import rotator
            
            db = ArchiveDB()
            boards = db.get_all_stored_boards()
            if not boards:
                self._logger.info("No stored boards found; skipping analysis run")
                return

            self._logger.info("Starting background analysis loop for %d boards", len(boards))
            for board in boards:
                try:
                    self._logger.info("Analyzing board /%s/...", board)
                    data = ingest_data([board])
                    if not data:
                        continue
                        
                    api_key = rotator.get_active_key() or os.getenv("OPENROUTER_API_KEY")
                    analyze_data(data, api_key, source_boards=[board])
                except Exception as e:
                    self._logger.error("Failed to analyze board /%s/: %s", board, e)
                    
            self._logger.info("All boards processed in background analysis run.")
        except Exception as e:
            self._logger.exception("Analysis job failed: %s", e)
