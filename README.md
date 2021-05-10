# pumpkin
Food Ordering System

## About

Pumpkin is a Food ordering system.


Hotels can SignUp/Login, edit their profile/details and create/edit items that they provide.They also have the option to close themselves or make an item unavailable or to opt in or out of delivery services. Hotels can change order and payment status of their pending orders.

Customers can SignUp/Login, add items to cart, change their quantity or delete items from cart and order available items provided by open Hotels.
They can opt for delivery services of hotels (which provide delivery as a service) while placing order. They also have the option to cancel orders.
Different orders are placed for different hotels.

Delivery Persons can SignUp/Login, view unassigned orders and accept orders which require delivery. They can change order and payment status of their pending orders.

All three types of users can view Pending, Completed and Cancelled orders.

## Installation

* #### System Package Requirements

    * NodeJS : https://nodejs.org/en/download/
    * NPM : npm is installed with Node.js. Refer:  https://www.npmjs.com/get-npm
    * MySQL

* #### Clone the repo
    ```sh
    git clone https://github.com/untrulynoxiusmj/pumpkin.git
    cd pumpkin
    ```
* #### MySQL setup

    * Make sure MySQL service is up and running.
    * Look for ```db.sql``` file in the root directory of project
    * To create required database and tables, execute ```db.sql``` file
    * Change MySQL configuration
        ```sh
        cd config
        # Edit db.js file to change configuration

        # Look for the following block of code in db.js

        # ==========================================
        const connection = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : 'root',
        database : 'pumpkin'
        });
        # ==========================================

        Here, change host, user and password as required.
        ```
    * You may need to execute this SQL query
        ```sh
        ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your password'
        ```
        Please refer to:
        https://github.com/mysqljs/mysql/issues/2046
        for more details.


* #### Running the project
    Open terminal in root directory of project
    ```sh
    npm install
    npm start
    ```

    Navigate to `localhost:5000` in your browser.