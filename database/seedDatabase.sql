-- RUN USING THIS COMMAND IN COMMAND PROMPT:
-- " psql -d seattalk -a -f ./database/seedDatabase.sql "

DROP DATABASE IF EXISTS seattalk;

CREATE DATABASE seattalk;

DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_clients;
DROP TABLE IF EXISTS clients;

CREATE TABLE rooms(
    id serial PRIMARY KEY, 
    room_id VARCHAR NOT NULL, 
    opened_at timestamptz default now(), 
    closed_at timestamptz
);

CREATE TABLE room_clients(
    id serial PRIMARY KEY,
    room_pk INT NOT NULL,
    client_pk INT NOT NULL
);

CREATE TABLE clients(
  id serial PRIMARY KEY,
  socket_id VARCHAR NOT NULL,
  is_sharing_audio boolean default FALSE,
  is_sharing_video boolean default FALSE,
  is_sharing_screen boolean default FALSE,
  joined_at timestamptz default now(),
  disconnected_at timestamptz
);

INSERT INTO rooms(room_id, opened_at, closed_at)
VALUES 
  ('testroom1', '2020-08-20 04:10:25-07', '2020-08-20 04:13:26-07'),
  ('testroom2', '2019-06-11 04:10:25-07', '2019-06-11 05:10:25-07');

INSERT INTO clients(socket_id, joined_at, disconnected_at)
VALUES 
  ('testdummy1', '2020-08-20 04:10:25-07', '2020-08-20 04:13:26-07'),
  ('testdummy2', '2019-06-11 04:10:25-07', '2019-06-11 05:10:25-07');

INSERT INTO room_clients(room_pk, client_pk)
VALUES 
  (1, 1),
  (1, 2)