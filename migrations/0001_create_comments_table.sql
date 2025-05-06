-- Migration: Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  timestamp TEXT,
  avatar TEXT,
  title TEXT,
  text TEXT,
  image TEXT,
  video TEXT,
  platform TEXT,
  tag TEXT
);
