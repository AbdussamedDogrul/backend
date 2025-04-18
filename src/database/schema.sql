-- Görev Yöneticisi Veritabanı Şeması

-- Veritabanı oluşturma
CREATE DATABASE IF NOT EXISTS task_manager_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Veritabanını kullanma
USE task_manager_db;

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Görev durumları tablosu
CREATE TABLE IF NOT EXISTS task_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#808080',
    user_id INT DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan görev durumlarını ekleme
INSERT INTO task_statuses (name, color, is_default) VALUES 
    ('Yapılacak', '#3498db', TRUE),
    ('Devam Ediyor', '#f39c12', TRUE),
    ('Tamamlandı', '#2ecc71', TRUE);

-- Görev kartları tablosu
CREATE TABLE IF NOT EXISTS task_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    due_date DATE DEFAULT NULL,
    priority INT DEFAULT 0,
    image VARCHAR(255) DEFAULT NULL,
    status_id INT NOT NULL,
    user_id INT NOT NULL,
    parent_id INT DEFAULT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status_id (status_id),
    INDEX idx_parent_id (parent_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES task_statuses(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_id) REFERENCES task_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Alt görevler tablosu
CREATE TABLE IF NOT EXISTS subtasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    task_card_id INT NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_card_id (task_card_id),
    FOREIGN KEY (task_card_id) REFERENCES task_cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Etiketler tablosu
CREATE TABLE IF NOT EXISTS tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) DEFAULT '#808080',
    user_id INT NOT NULL,
    INDEX idx_user_id (user_id),
    UNIQUE KEY unique_tag_per_user (name, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Görev-Etiket ilişki tablosu
CREATE TABLE IF NOT EXISTS task_tags (
    task_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES task_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kullanıcı etiketleme tablosu
CREATE TABLE IF NOT EXISTS user_mentions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    mentioned_user_id INT NOT NULL,
    mentioning_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    INDEX idx_mentioned_user_id (mentioned_user_id),
    FOREIGN KEY (task_id) REFERENCES task_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioned_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mentioning_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    related_id INT DEFAULT NULL,
    related_type ENUM('task', 'mention', 'subtask') DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bildirim tetikleyicileri

-- Kullanıcı etiketleme bildirimi
DELIMITER //
CREATE TRIGGER after_user_mention_insert
AFTER INSERT ON user_mentions
FOR EACH ROW
BEGIN
    DECLARE mentioner_name VARCHAR(50);
    
    SELECT username INTO mentioner_name FROM users WHERE id = NEW.mentioning_user_id;
    
    INSERT INTO notifications (user_id, content, related_id, related_type)
    VALUES (
        NEW.mentioned_user_id, 
        CONCAT(mentioner_name, ' sizi bir görevde etiketledi'), 
        NEW.task_id, 
        'mention'
    );
END //
DELIMITER ;

-- Alt görev tamamlama bildirimi
DELIMITER //
CREATE TRIGGER after_subtask_update
AFTER UPDATE ON subtasks
FOR EACH ROW
BEGIN
    DECLARE task_owner INT;
    DECLARE task_title VARCHAR(100);
    
    IF NEW.is_completed = TRUE AND OLD.is_completed = FALSE THEN
        SELECT user_id, title INTO task_owner, task_title FROM task_cards WHERE id = NEW.task_card_id;
        
        INSERT INTO notifications (user_id, content, related_id, related_type)
        VALUES (
            task_owner, 
            CONCAT('"', task_title, '" görevindeki "', NEW.title, '" alt görevi tamamlandı'), 
            NEW.task_card_id, 
            'subtask'
        );
    END IF;
END //
DELIMITER ;
