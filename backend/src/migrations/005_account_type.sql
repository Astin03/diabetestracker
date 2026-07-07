USE astin_diabetes;

ALTER TABLE users
  ADD COLUMN account_type ENUM('patient', 'guardian') NOT NULL DEFAULT 'patient' AFTER diabetes_type;
