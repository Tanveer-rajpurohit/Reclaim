CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  password_hash text NOT NULL,
  verified_at timestamptz,
  name text NOT NULL CHECK (length(name) BETWEEN 2 AND 40),
  phone text NOT NULL DEFAULT '',
  area text NOT NULL DEFAULT '',
  buyer_type text NOT NULL DEFAULT 'none' CHECK (buyer_type IN ('none', 'reuse', 'bulk')),
  interests text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE auth_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify', 'reset')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL CHECK (length(name) BETWEEN 3 AND 80),
  area text NOT NULL CHECK (length(area) BETWEEN 2 AND 60),
  event_date date NOT NULL,
  pickup_note text NOT NULL CHECK (length(pickup_note) <= 300),
  delivery_note text NOT NULL DEFAULT '' CHECK (length(delivery_note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_owner ON events(owner_id);

CREATE TABLE uploads (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id),
  object_key text NOT NULL UNIQUE,
  bytes integer NOT NULL CHECK (bytes > 0 AND bytes <= 1500000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE items (
  id uuid PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES events(id),
  name text NOT NULL CHECK (length(name) BETWEEN 3 AND 80),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 600),
  category text NOT NULL CHECK (category IN ('Wood','Paper','Decor','Plants','Cloth','Furniture','Metal','Plastic','Glass','Electronics','Other')),
  purpose text NOT NULL CHECK (purpose IN ('Reuse', 'Recycle')),
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL CHECK (unit IN ('pieces','bundles','kg')),
  condition text NOT NULL CHECK (condition IN ('Good','Fair','Poor')),
  price numeric(12,2) NOT NULL CHECK (price BETWEEN 0 AND 1000000),
  hazards text NOT NULL DEFAULT '' CHECK (length(hazards) <= 600),
  art text NOT NULL,
  state text NOT NULL DEFAULT 'Available' CHECK (state IN ('Available','Reserved','Done','Withdrawn')),
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (unit = 'kg' OR quantity = trunc(quantity))
);
CREATE INDEX items_event ON items(event_id);
CREATE INDEX items_discovery ON items(state, created_at DESC);

CREATE TABLE item_photos (
  item_id uuid NOT NULL REFERENCES items(id),
  upload_id uuid NOT NULL REFERENCES uploads(id),
  position integer NOT NULL CHECK (position BETWEEN 0 AND 4),
  PRIMARY KEY(item_id, position),
  UNIQUE(item_id, upload_id)
);

CREATE TABLE deals (
  id uuid PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES items(id),
  buyer_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Done','Declined','Cancelled')),
  pickup_at timestamptz NOT NULL,
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 300),
  reason text NOT NULL DEFAULT '' CHECK (length(reason) <= 300),
  buyer_confirmed boolean NOT NULL DEFAULT false,
  seller_confirmed boolean NOT NULL DEFAULT false,
  accepted_at timestamptz,
  completed_at timestamptz,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'Done' OR (seller_confirmed AND completed_at IS NOT NULL)),
  CHECK (status NOT IN ('Accepted','Done') OR accepted_at IS NOT NULL)
);
CREATE UNIQUE INDEX one_reservation ON deals(item_id) WHERE status = 'Accepted';
CREATE UNIQUE INDEX one_completion ON deals(item_id) WHERE status = 'Done';
CREATE UNIQUE INDEX one_active_request ON deals(item_id, buyer_id) WHERE status IN ('Pending','Accepted');
CREATE INDEX deals_buyer ON deals(buyer_id, created_at DESC);

CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL,
  title text NOT NULL,
  detail text NOT NULL,
  href text NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_recipient ON notifications(recipient_id, created_at DESC);

CREATE TABLE outbox (
  id uuid PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES users(id),
  template text NOT NULL,
  payload jsonb NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  provider_message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
CREATE INDEX outbox_ready ON outbox(status, available_at);

CREATE TABLE saved_items (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  PRIMARY KEY(user_id, item_id)
);

CREATE TABLE idempotency (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL,
  fingerprint text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, key)
);

CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  reset_at timestamptz NOT NULL
);
