from flask import Flask, request, render_template, jsonify
from flask.cli import with_appcontext
from sqlalchemy.orm import Session
from src.collectors.sql_collector import SQLCollector
from src.app import SessionLocal  # Correct import path
from bokeh.plotting import figure
from bokeh.embed import components
from src.config import load_config  # Ensure load_config is imported
from src.alerting.alert_manager import AlertManager  # Ensure AlertManager is imported

app = Flask(__name__)

# Load configuration
config = load_config()

# Initialize other components
collector = SQLCollector(config)
alert_manager = AlertManager(config)

@app.route("/", methods=["GET"])
def read_root():
    return render_template("index.html")

@app.route("/execute-query", methods=["POST"])
def execute_query():
    try:
        database = request.form.get("database")
        sql_query = request.form.get("sql_query")

        # Create a new session instance based on selected database
        if database == 'postgresql':
            session: Session = SessionLocal()  # Create a session instance
        elif database == 'sqlite':
            session: Session = SessionLocal()  # Adjust for SQLite
        else:
            return jsonify({"error": "Unsupported database type"}), 400

        result = session.execute(sql_query)
        data = result.fetchall()
        session.close()  # Close the session

        # Create a Bokeh plot
        p = figure(title="SQL Query Performance", x_axis_label='Time', y_axis_label='Query Time (ms)')
        p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], legend_label="Query Time", line_width=2)
        script, div = components(p)

        return render_template("result.html", data=data, script=script, div=div)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)