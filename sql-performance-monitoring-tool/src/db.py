from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def connect_to_db(config):
    db_type = config['database']['type']
    user = config['database']['user']
    host = config['database']['host']
    port = config['database']['port']
    database_name = config['database']['database_name']

    if db_type == 'postgresql':
        DATABASE_URL = f"postgresql://{user}@{host}:{port}/{database_name}"
    elif db_type == 'sqlite':
        DATABASE_URL = f"sqlite:///./{database_name}.db"
    else:
        raise ValueError(f"Unsupported database type: {db_type}")

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal