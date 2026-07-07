-- Astin Diabetes System - Initial Schema (MySQL)

CREATE DATABASE IF NOT EXISTS astin_diabetes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE astin_diabetes;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  diabetes_type ENUM('type_1', 'type_1_5', 'type_2', 'gestational') DEFAULT 'type_2',
  glucose_unit ENUM('mg/dL') DEFAULT 'mg/dL',
  target_low DECIMAL(5,1) DEFAULT 70.0,
  target_high DECIMAL(5,1) DEFAULT 180.0,
  timezone VARCHAR(64) DEFAULT 'UTC',
  notifications_enabled TINYINT(1) DEFAULT 1,
  sound_alerts TINYINT(1) DEFAULT 1,
  browser_notifications TINYINT(1) DEFAULT 1,
  dark_mode TINYINT(1) DEFAULT 0,
  streak_days INT UNSIGNED DEFAULT 0,
  last_log_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS glucose_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  value DECIMAL(6,1) NOT NULL,
  reading_type ENUM(
    'pre_breakfast', 'post_breakfast_2h', 'pre_lunch', 'post_lunch_2h',
    'pre_dinner', 'post_dinner_2h', 'before_sleep', 'random'
  ) NOT NULL DEFAULT 'random',
  recorded_at DATETIME NOT NULL,
  notes TEXT,
  meal_notes VARCHAR(500),
  tags JSON,
  category ENUM('hypoglycemia', 'normal', 'hyperglycemia') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_glucose_user_date (user_id, recorded_at),
  INDEX idx_glucose_category (user_id, category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(128),
  notes TEXT,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  reminder_time TIME NOT NULL,
  frequency_type ENUM('daily', 'every_other_day', 'weekdays', 'multiple_daily', 'custom_interval') NOT NULL DEFAULT 'daily',
  frequency_config JSON,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_medications_user (user_id, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medication_checklists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  medication_id INT UNSIGNED NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status ENUM('pending', 'taken', 'missed') DEFAULT 'pending',
  taken_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
  UNIQUE KEY uk_med_schedule (medication_id, scheduled_date, scheduled_time),
  INDEX idx_checklist_user_date (user_id, scheduled_date),
  INDEX idx_checklist_status (user_id, status, scheduled_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reminders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  medication_id INT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  remind_at DATETIME NOT NULL,
  is_recurring TINYINT(1) DEFAULT 0,
  recurrence_rule VARCHAR(128),
  is_sent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE SET NULL,
  INDEX idx_reminders_user_time (user_id, remind_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('doctor', 'lab', 'other') DEFAULT 'doctor',
  appointment_at DATETIME NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_appointments_user (user_id, appointment_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('glucose_alert', 'medication', 'appointment', 'system') DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user (user_id, is_read, created_at)
) ENGINE=InnoDB;
