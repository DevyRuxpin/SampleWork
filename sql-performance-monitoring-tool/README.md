# SQL Performance Monitoring Tool

This project is a SQL Performance Monitoring Tool that collects and alerts users about the performance of SQL databases and queries.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sql-performance-monitoring-tool.git
   cd sql-performance-monitoring-tool
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Configure the `config.yaml` file with your database connection details and alert thresholds.

## Usage

To start the monitoring tool, run the following command:
```
uvicorn src.main:app --reload
```

## Project Structure

```
sql-performance-monitoring-tool/
├── .vscode/
│   └── settings.json
├── config.yaml
├── package.json
├── README.md
├── requirements.txt
├── src/
│   ├── alerting/
│   │   └── alert_manager.py
│   ├── collectors/
│   │   └── sql_collector.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py
│   ├── scripts/
│   │   └── bokeh_app.py
│   ├── styles/
│   │   ├── tailwind.css
│   │   └── styles.css
│   ├── templates/
│   │   ├── base.html
│   │   ├── dashboard.html
│   │   ├── index.html
│   │   └── metrics.html
│   ├── utils/
│   │   ├── db_utils.py
│   │   └── url_utils.py
│   ├── visualizers/
│   │   └── performance_visualizer.py
│   ├── app.py
│   ├── commands.py
│   ├── config.py
│   ├── db.py
│   ├── main.py
│   └── metrics.py
└── tailwind.config.js
```