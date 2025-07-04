class AlertManager:
    def __init__(self, config):
        self.config = config

    def check_thresholds(self, metrics):
        alerts = []
        thresholds = self.config['thresholds']

        # Check CPU usage
        if metrics['cpu_usage'] > thresholds['cpu_usage']:
            alerts.append({'message': 'CPU usage is high', 'severity': 'high'})

        # Check memory usage
        if metrics['memory_usage'] > thresholds['memory_usage']:
            alerts.append({'message': 'Memory usage is high', 'severity': 'high'})

        # Check query response time
        if metrics['query_response_time'] > thresholds['query_response_time']:
            alerts.append({'message': 'Query response time is high', 'severity': 'high'})

        return alerts