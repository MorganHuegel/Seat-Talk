-- RUN USING THIS COMMAND IN COMMAND PROMPT:
-- " psql -d seattalk -a -f ./database/seedDatabase.sql "

DROP DATABASE IF EXISTS seattalk;

CREATE DATABASE seattalk;

DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_clients;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS chats;

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
  display_name VARCHAR,
  socket_id VARCHAR NOT NULL,
  audio_track_id VARCHAR,
  video_track_id VARCHAR,
  screen_video_track_id VARCHAR,
  screen_audio_track_id VARCHAR,
  joined_at timestamptz default now(),
  did_share_audio boolean default false,
  did_share_video boolean default false,
  did_share_screen_audio boolean default false,
  did_share_screen_video boolean default false,
  disconnected_at timestamptz
);
CREATE TABLE logs(
  id serial PRIMARY KEY,
  log_message VARCHAR,
  created_at timestamptz default now()
);
CREATE TABLE chats(
  id serial PRIMARY KEY,
  client_pk INT NOT NULL,
  message VARCHAR,
  type VARCHAR,
  created_at timestamptz default now(),
  CONSTRAINT fk_client
      FOREIGN KEY(client_pk) 
	    REFERENCES clients(id)
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