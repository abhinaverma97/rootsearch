import threading
import time
import logging
from typing import List, Optional

from board_scraper import get_all_boards, scrape_board


class MonitorService:
    """Simple threaded monitor that reuses existing scraper functions to keep the archive fresh."""

    def __init__(self, interval: int = 300, boards: Optional[List[str]] = None):
        self.interval = interval
        self.boards = boards
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._logger = logging.getLogger("monitor_service")

    def start(self):
        if self._thread and self._thread.is_alive():
            self._logger.info("Monitor already running")
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True, name="MonitorThread")
        self._thread.start()
        self._logger.info("Monitor started")

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=10)
        self._logger.info("Monitor stopped")

    def running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def _run(self):
        while not self._stop_event.is_set():
            try:
                boards = self.boards or get_all_boards()
                if not boards:
                    self._logger.warning("No boards found; will retry after interval")
                for b in boards:
                    if self._stop_event.is_set():
                        break
                    try:
                        self._logger.info(f"Scraping board /{b}/")
                        scrape_board(b)
                    except Exception as e:
                        self._logger.exception(f"Error scraping {b}: {e}")

                # After scraping all boards, run the keyword sweep to find matches for users
                try:
                    from tracking import run_sweep
                    self._logger.info("Running keyword sweep for all users...")
                    run_sweep()
                except Exception as e:
                    self._logger.exception(f"Error during automated keyword sweep: {e}")

                # Sleep in small steps so stop() is responsive
                steps = max(1, int(self.interval))
                for _ in range(steps):
                    if self._stop_event.is_set():
                        break
                    time.sleep(1)
            except Exception as e:
                self._logger.exception(f"Monitor loop failed: {e}")
                time.sleep(60)
