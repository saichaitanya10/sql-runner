import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), 'sql_runner.db')

schema = """
CREATE TABLE IF NOT EXISTS Customers (
  CustomerID INTEGER PRIMARY KEY AUTOINCREMENT,
  Name TEXT NOT NULL,
  Email TEXT,
  City TEXT
);
"""

seed = [
    ("Alice", "alice@example.com", "New York"),
    ("Bob", "bob@example.com", "San Francisco"),
    ("Charlie", "charlie@example.com", "Chicago"),
]

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.executescript(schema)
cur.execute("SELECT COUNT(*) FROM Customers;")
count = cur.fetchone()[0]
if count == 0:
    cur.executemany("INSERT INTO Customers(Name, Email, City) VALUES (?, ?, ?)", seed)
    conn.commit()
conn.close()
print("Database initialized at", DB_PATH)
