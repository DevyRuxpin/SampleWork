from flask import Flask
from flask.cli import with_appcontext
import click
from src.app import SessionLocal
from src.models import Base

app = Flask(__name__)

@app.cli.command("init-db")
@with_appcontext
def init_db_command():
    """Initialize the database."""
    engine = SessionLocal().get_bind()
    Base.metadata.create_all(bind=engine)
    click.echo("Initialized the database.")

if __name__ == "__main__":
    app.run()