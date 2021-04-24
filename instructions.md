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
  bio                 VARCHAR(150),
  delivery            BOOL DEFAULT 0,
  PRIMARY KEY         (username)                             
);

CREATE TABLE customer
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,
  address            VARCHAR(150),    
  phone            VARCHAR(15) NOT NULL,  
  bio                 VARCHAR(150),
  PRIMARY KEY         (username)                             
);

CREATE TABLE delivery_person
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,
  address            VARCHAR(150),    
  phone            VARCHAR(15) NOT NULL,  
  bio                 VARCHAR(150),
  PRIMARY KEY         (username)                             
);

CREATE TABLE item
(
  id                    INT PRIMARY KEY AUTO_INCREMENT,                
  h_username            VARCHAR(150) NOT NULL,                
  name                  VARCHAR(150) NOT NULL,
  image                 VARCHAR(150) NOT NULL,
  details               VARCHAR(150),    
  cost                  VARCHAR(150)                      
);

CREATE TABLE cart
(
  id                       INT PRIMARY KEY AUTO_INCREMENT,
  c_username               VARCHAR(150) NOT NULL,                
  i_id                     VARCHAR(150) NOT NULL,
  i_quantity               VARCHAR(150)                  
);

CREATE TABLE order
(
  id                         INT PRIMARY KEY AUTO_INCREMENT,                
  i_c_id                     VARCHAR(150) NOT NULL,   
  cost                       VARCHAR(150) NOT NULL,
  d_username                 VARCHAR(150),
  address                    VARCHAR(150) NOT NULL,
  payment_status             BOOL DEFAULT 0,
  order_status               BOOL DEFAULT 0,
);