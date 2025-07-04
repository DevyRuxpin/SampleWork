from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class QueryMetric(Base):
    __tablename__ = 'query_metrics'
    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(Text)
    execution_time = Column(Float)
    cpu_usage = Column(Float)
    memory_usage = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50))
    message = Column(Text)
    severity = Column(String(20))
    timestamp = Column(DateTime, default=datetime.utcnow)