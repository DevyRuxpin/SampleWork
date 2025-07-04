from sqlalchemy.orm import Session

class SQLCollector:
    def __init__(self, engine):
        self.engine = engine

    def collect_metrics(self):
        metrics = {}
        try:
            with self.engine.connect() as connection:
                result = connection.execute("SELECT * FROM pg_stat_database")
                metrics['query_performance'] = result.fetchall()
        except Exception as e:
            print(f"Error collecting metrics: {e}")
        return metrics