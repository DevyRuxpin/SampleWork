from sqlalchemy.orm import Session
from .db import connect_to_db

class MetricsCollector:
    def __init__(self, config):
        self.db = connect_to_db(config)

    def collect_metrics(self):
        metrics = {}
        try:
            with self.db() as session:
                result = session.execute("SELECT * FROM pg_stat_database")
                metrics['query_performance'] = result.fetchall()
        except Exception as e:
            print(f"Error collecting metrics: {e}")
        return metrics