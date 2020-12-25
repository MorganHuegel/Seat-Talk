-- RUN USING THIS COMMAND IN COMMAND PROMPT:
-- " psql -d seattalk -a -f ./database/seedDatabase.sql "

DROP DATABASE IF EXISTS seattalk;

CREATE DATABASE seattalk;

DROP TABLE IF EXISTS channels;

-- CREATE TABLE channels(
--   id serial PRIMARY KEY,
--   session_id VARCHAR NOT NULL,
--   socket_id VARCHAR NOT NULL,
--   opened_at TIMESTAMPTZ default NOW(),
--   closed_at TIMESTAMPTZ default NOW(),
-- );

CREATE TABLE channels(
    id serial PRIMARY KEY, 
    session_id VARCHAR NOT NULL, 
    socket_id varchar not null unique, 
    opened_at timestamptz default now(), 
    closed_at timestamptz
);

INSERT INTO channels(session_id, socket_id, opened_at, closed_at)
VALUES 
  ('abc', 'eeefff12345', '2020-08-20 04:10:25-07', '2020-08-20 04:13:26-07'),
  ('abc', 'eeefff123456', '2020-08-20 04:10:25-07', null),
  ('abc123', 'aaabbb54321', '2019-06-11 04:10:25-07', '2019-06-11 05:10:25-07');
