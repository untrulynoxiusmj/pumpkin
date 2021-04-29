<!-- CREATE TABLE user
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,                
  PRIMARY KEY         (username)                             
); -->

CREATE TABLE hotel
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,
  address            VARCHAR(150) NOT NULL,
  phone            VARCHAR(15) NOT NULL,    
  bio                 TEXT NOT NULL,
  image               VARCHAR(150) NOT NULL,
  delivery            BOOL DEFAULT 0,
  open                BOOL DEFAULT 1,
  PRIMARY KEY         (username),   
  CHECK (LENGTH(username) > 5),
  CHECK (LENGTH(password) > 5)   
);

<!-- DELIMITER $$
CREATE TRIGGER trig_username_check BEFORE INSERT ON hotel
FOR EACH ROW 
BEGIN 
IF (NEW.username REGEXP '[A-Za-z0-9]+' ) = 0 THEN 
  SIGNAL SQLSTATE '12345'
     SET MESSAGE_TEXT = 'Wroooong!!!';
END IF; 
END$$
DELIMITER ; -->

CREATE TABLE customer
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,
  address            VARCHAR(150),    
  phone            VARCHAR(15) NOT NULL,  
  image             LONGBLOB,
  bio                 VARCHAR(150),
  PRIMARY KEY         (username),
    CHECK (LENGTH(username) > 5),
  CHECK (LENGTH(password) > 5)                           
);

CREATE TABLE delivery
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,
  address            VARCHAR(150),    
  phone            VARCHAR(15) NOT NULL,  
  image               VARCHAR(150) NOT NULL,
  bio                 VARCHAR(150),
  PRIMARY KEY         (username),
    CHECK (LENGTH(username) > 5),
  CHECK (LENGTH(password) > 5)             
);

CREATE TABLE item
(
  id                    INT PRIMARY KEY AUTO_INCREMENT,                
  h_username            VARCHAR(150) NOT NULL,                
  name                  VARCHAR(150) NOT NULL,
  image                 VARCHAR(150) NOT NULL,
  details               text NOT NULL,    
  available             BOOL DEFAULT 1 NOT NULL,
  cost                  INT NOT NULL,
  CHECK (cost > 0),
  CHECK (LENGTH(name) > 0),
  FOREIGN KEY (h_username) REFERENCES hotel(username)
);

CREATE TABLE cart
(
  c_username               VARCHAR(150) NOT NULL,                
  i_id                     VARCHAR(150) NOT NULL,
  i_quantity               VARCHAR(150) DEFAULT 1,
  PRIMARY KEY         (c_username, i_id)
);

CREATE TABLE cart_deliver
(
  c_username               VARCHAR(150) NOT NULL,                
  h_username                    VARCHAR(150) NOT NULL,
  delivery_chosen          BOOL DEFAULT 0,
  PRIMARY KEY         (c_username, h_username)
);

<!-- CREATE TABLE deliver
(
  id                         INT PRIMARY KEY AUTO_INCREMENT,
  o_id                         INT                
  c_username                 VARCHAR(150) NOT NULL,                
  h_username                 VARCHAR(150) NOT NULL,
); -->


CREATE TABLE order_t
(
  id                         INT PRIMARY KEY AUTO_INCREMENT,                
  c_username                 VARCHAR(150) NOT NULL,                
  i_id                       VARCHAR(150) NOT NULL,
  i_quantity                 VARCHAR(150),
  cost                       VARCHAR(150) NOT NULL,
  delivery_chosen            BOOL DEFAULT 0,
  d_username                 VARCHAR(150),
  address                    VARCHAR(150) NOT NULL,
  timestamp                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status             ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  order_status               ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING'
);