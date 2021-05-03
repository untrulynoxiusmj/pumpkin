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
  delivery_cost        INT NOT NULL DEFAULT 0,
  PRIMARY KEY         (username),   
  CHECK (LENGTH(username) > 5),
  CHECK (LENGTH(password) > 5)   
);

CREATE TABLE customer
(
  username            VARCHAR(150) NOT NULL,                
  password            VARCHAR(150) NOT NULL,                
  name                VARCHAR(150) NOT NULL,
  address            VARCHAR(150),    
  phone            VARCHAR(15) NOT NULL,  
  image             VARCHAR(150) NOT NULL,
  bio                 TEXT NOT NULL,
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
  category              ENUM('fast', 'indian', 'south', 'punjabi', 'gujarati', 'other') DEFAULT 'other',
  CHECK (cost > 0),
  CHECK (LENGTH(name) > 0),
  FOREIGN KEY (h_username) REFERENCES hotel(username)
);

CREATE TABLE cart
(
  c_username               VARCHAR(150) NOT NULL,                
  i_id                     INT NOT NULL,
  i_quantity               INT NOT NULL DEFAULT 1,
  PRIMARY KEY         (c_username, i_id),
  FOREIGN KEY (c_username) REFERENCES customer(username),
  FOREIGN KEY (i_id) REFERENCES item(id)
);

CREATE TABLE cart_deliver
(
  c_username               VARCHAR(150) NOT NULL,                
  h_username                    VARCHAR(150) NOT NULL,
  delivery_chosen          BOOL DEFAULT 0,
  PRIMARY KEY         (c_username, h_username),
  FOREIGN KEY (c_username) REFERENCES customer(username),
  FOREIGN KEY (h_username) REFERENCES hotel(username)
);

CREATE TABLE order_t
(
  id                         INT PRIMARY KEY AUTO_INCREMENT,                
  c_username                 VARCHAR(150) NOT NULL,                
  i_id                       INT NOT NULL,
  i_quantity                 INT NOT NULL DEFAULT 1,
  cost                       INT NOT NULL,
  delivery_chosen            BOOL DEFAULT 0,
  d_username                 VARCHAR(150),
  address                    VARCHAR(150) NOT NULL,
  timestamp                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status             ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  order_status               ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  FOREIGN KEY (c_username) REFERENCES customer(username),
  FOREIGN KEY (i_id) REFERENCES item(id),
  FOREIGN KEY (d_username) REFERENCES delivery(username)
);












CREATE TABLE order_icht
(
  id                         INT PRIMARY KEY AUTO_INCREMENT,                
  c_username                 VARCHAR(150) NOT NULL,                
  h_username                 VARCHAR(150) NOT NULL,
  timestamp                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_chosen            BOOL NOT NULL DEFAULT 0,
  d_username                 VARCHAR(150),
  delivery_cost              INT NOT NULL DEFAULT 0,
  address                    VARCHAR(150) NOT NULL,
  payment_status             ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  order_status               ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  moved                      BOOL NOT NULL DEFAULT 0,
  FOREIGN KEY (c_username) REFERENCES customer(username),
  FOREIGN KEY (h_username) REFERENCES hotel(username),
  FOREIGN KEY (d_username) REFERENCES delivery(username)
)

CREATE TABLE order_ioi
(       
  o_id                       INT NOT NULL,
  i_id                       INT NOT NULL,
  i_quantity                 INT NOT NULL DEFAULT 1,
  cost                       INT NOT NULL,
  PRIMARY KEY               (o_id, i_id),
  FOREIGN KEY (o_id) REFERENCES order_icht(id),
  FOREIGN KEY (i_id) REFERENCES item(id)
);










<!-- 
INSERT INTO order_icht (c_username, h_username, delivery_chosen, delivery_cost, address) select distinct ca.c_username, i.h_username , cd.delivery_chosen, h.delivery_cost, "basant vihar" from cart ca, item i, cart_deliver cd, hotel h where ca.c_username="chetangarg365" and ca.i_id=i.id AND cd.c_username=ca.c_username AND i.h_username=cd.h_username AND i.h_username=h.username order by i.h_username; -->

<!-- select o.id as oid, ca.i_id, ca.i_quantity, (ca.i_quantity*i.cost) as cost from order_icht o, cart ca, item i where ca.i_id=i.id AND ca.i_id in (select id from item where h_username=o.h_username) order by oid; -->