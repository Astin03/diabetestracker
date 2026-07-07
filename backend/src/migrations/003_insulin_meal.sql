USE astin_diabetes;

ALTER TABLE insulin_logs
  ADD COLUMN meal ENUM('breakfast', 'lunch', 'dinner') NOT NULL DEFAULT 'breakfast' AFTER insulin_type;

CREATE INDEX idx_insulin_user_meal ON insulin_logs (user_id, meal, recorded_at);
