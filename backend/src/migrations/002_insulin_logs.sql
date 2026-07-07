USE astin_diabetes;

CREATE TABLE IF NOT EXISTS insulin_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  insulin_type ENUM('apidra', 'lantus') NOT NULL,
  meal ENUM('breakfast', 'lunch', 'dinner') NOT NULL DEFAULT 'breakfast',
  units DECIMAL(6,2) NOT NULL,
  recorded_at DATETIME NOT NULL,
  notes TEXT,
  injection_site VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_insulin_user_date (user_id, recorded_at),
  INDEX idx_insulin_user_type (user_id, insulin_type, recorded_at)
) ENGINE=InnoDB;
