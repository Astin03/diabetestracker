USE astin_diabetes;

CREATE TABLE IF NOT EXISTS care_access (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id INT UNSIGNED NOT NULL,
  caregiver_id INT UNSIGNED NULL,
  invited_email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NULL,
  role ENUM('viewer') NOT NULL DEFAULT 'viewer',
  status ENUM('pending', 'accepted', 'revoked') NOT NULL DEFAULT 'pending',
  invite_token VARCHAR(64) NOT NULL,
  accepted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_patient_email (patient_id, invited_email),
  INDEX idx_caregiver_status (caregiver_id, status),
  INDEX idx_invite_token (invite_token)
) ENGINE=InnoDB;
