-- Initial schema migration generated manually

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(64),
  address varchar(500)
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  phone varchar(32),
  password_hash varchar(255) NOT NULL,
  full_name varchar(255) NOT NULL,
  hotel_id uuid REFERENCES hotels(id) ON DELETE SET NULL,
  role varchar(64) NOT NULL DEFAULT 'staff',
  is_verified boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  role varchar(64) NOT NULL,
  expires_at varchar(64),
  accepted varchar(16) NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token varchar(255) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(64) NOT NULL,
  expires_at varchar(64),
  used boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash varchar(255) NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamp NOT NULL,
  revoked boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
