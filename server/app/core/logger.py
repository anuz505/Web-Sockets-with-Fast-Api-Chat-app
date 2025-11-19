"""
Logging configuration for the application.
"""

import logging
import sys
from pathlib import Path
from typing import Optional

from core.config import settings


class LoggerSetup:
    """Configure application logging with consistent formatting."""

    @staticmethod
    def setup_logger(
        name: str, level: Optional[str] = None, log_file: Optional[Path] = None
    ) -> logging.Logger:
        """
        Set up a logger with console and optional file handlers.

        Args:
            name: Logger name
            level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_file: Optional file path for file handler

        Returns:
            Configured logger instance
        """
        logger = logging.getLogger(name)

        # Set level from settings or parameter
        log_level = level or settings.log_level
        logger.setLevel(getattr(logging, log_level.upper()))

        # Prevent duplicate handlers
        if logger.handlers:
            return logger

        # Create formatter
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # File handler (optional)
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

        return logger


# Create default application logger
logger = LoggerSetup.setup_logger("Chat application sarcasm sync")
