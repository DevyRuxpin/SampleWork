from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Import your models here
from .models import QueryMetric, Alert
