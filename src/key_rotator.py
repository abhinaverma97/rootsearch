import os
import logging
from analysis_db import AnalysisDB
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded
# This is usually done in app.py or analysis.py, but good to have here as well 
# to support standalone usage of the rotator.
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)

class KeyRotator:
    def __init__(self, rotation_threshold=40):
        self._logger = logging.getLogger("key_rotator")
        self.rotation_threshold = rotation_threshold
        self.db = AnalysisDB()
        
        # Load keys from environment
        self.keys = [
            os.getenv("OPENROUTER_API_KEY_1"),
            os.getenv("OPENROUTER_API_KEY_2"),
            os.getenv("OPENROUTER_API_KEY_3")
        ]
        # Filter out empty keys
        self.keys = [k for k in self.keys if k and k != "<OPENROUTER_API_KEY>"]
        
        if not self.keys:
            self._logger.error("No valid OpenRouter API keys found in .env.local")

    def get_active_key(self):
        """Returns the current API key based on the global request count."""
        if not self.keys:
            return None
            
        count_str = self.db.get_setting("api_request_count", "0")
        try:
            count = int(count_str)
        except ValueError:
            count = 0
            
        # Select key index based on floor division of count / threshold
        # then modulo the number of available keys
        key_index = (count // self.rotation_threshold) % len(self.keys)
        
        active_key = self.keys[key_index]
        # Mask the key in logs for security
        masked_key = active_key[:8] + "..." + active_key[-4:] if active_key else "None"
        self._logger.info(f"Using API Key #{key_index + 1} (Request Count: {count})")
        return active_key

    def increment_count(self):
        """Increments the global API request count."""
        count_str = self.db.get_setting("api_request_count", "0")
        try:
            count = int(count_str)
        except ValueError:
            count = 0
            
        new_count = count + 1
        self.db.update_setting("api_request_count", new_count)
        self._logger.info(f"API request count incremented to {new_count}")

# Singleton instance
rotator = KeyRotator()
