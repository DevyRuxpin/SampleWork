from flask import Flask
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, QueryMetric, Alert
from .visualizers.performance_visualizer import PerformanceVisualizer
from .alerting.alert_manager import AlertManager
from .collectors.sql_collector import SQLCollector
import ruamel.yaml
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load configuration
with open('config.yaml', 'r') as file:  # Corrected path to config.yaml
    yaml = ruamel.yaml.YAML()
    config = yaml.load(file)

# Configure database
db_type = config['database']['type']
user = config['database']['user']
password = config['database']['password']
host = config['database']['host']
port = config['database']['port']
database_name = config['database']['database_name']

if db_type == 'postgresql':
    DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{database_name}"
elif db_type == 'sqlite':
    DATABASE_URL = f"sqlite:///./{database_name}.db"
else:
    raise ValueError("Unsupported database type")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Initialize other components
collector = SQLCollector(engine)
visualizer = PerformanceVisualizer()
alert_manager = AlertManager(config)  # Pass the config argument

# Create database tables
Base.metadata.create_all(bind=engine)