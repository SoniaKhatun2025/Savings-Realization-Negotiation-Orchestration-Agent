import pymysql
import os
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """
    Returns a PyMySQL database connection.
    Autocommit is set to True for simplicity in this implementation.
    """
    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        print(" Database connection established successfully.")
        return connection
    except pymysql.MySQLError as e:
        print(f"Error connecting to MySQL Database: {e}")
        raise e

