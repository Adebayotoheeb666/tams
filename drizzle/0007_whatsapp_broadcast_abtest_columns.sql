ALTER TABLE whatsapp_broadcasts ADD COLUMN is_ab_test INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE whatsapp_broadcasts ADD COLUMN parent_broadcast_id TEXT;
ALTER TABLE whatsapp_broadcasts ADD COLUMN variant_label TEXT;
ALTER TABLE whatsapp_broadcasts ADD COLUMN winner_variant TEXT;
ALTER TABLE whatsapp_broadcasts ADD COLUMN buffer_post_id TEXT;
