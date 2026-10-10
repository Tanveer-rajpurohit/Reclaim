-- A completed item cannot also acquire another reservation, even through a direct write.
CREATE UNIQUE INDEX one_committed_handover ON deals(item_id) WHERE status IN ('Accepted','Done');
