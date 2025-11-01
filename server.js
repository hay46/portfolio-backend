// import express from "express";
// import mysql from "mysql2";
// import cors from "cors";
// import dotenv from "dotenv";

// dotenv.config(); // load .env variables

// const app = express();
// // ✅ TypeScript-safe PORT
// const PORT = process.env.PORT ? Number(process.env.PORT) : 3306;

// app.use(cors());
// app.use(express.json());

// // MySQL connection
// const db = mysql.createConnection({
//   host: process.env.DB_HOST || "localhost"
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD || "root",
//   database: process.env.DB_NAME || "haymanot-ebabu-portfolio",
//    port: 3306, // default MySQL port
// });

// // Test DB connection
// db.connect((err) => {
//   if (err) {
//     console.error("Database connection failed:", err.message);
//   } else {
//     console.log("Connected to MySQL Database!");
//   }
// });

// // Example route
// app.get("/", (req, res) => {
//   res.send("Server and Database are running!");
// });


// // Route: create all tables
// app.get("/create-all-tables", (req, res) => {
//   const createCompanies = `
//     CREATE TABLE IF NOT EXISTS companies (
//       company_id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(255) NOT NULL
//     )
//   `;
//   const createCustomers = `
//     CREATE TABLE IF NOT EXISTS customers (
//       customer_id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(255) NOT NULL,
//       company_id INT,
//       FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL
//     )
//   `;
//   const createAddresses = `
//     CREATE TABLE IF NOT EXISTS addresses (
//       address_id INT AUTO_INCREMENT PRIMARY KEY,
//       customer_id INT,
//       address_line VARCHAR(255) NOT NULL,
//       city VARCHAR(100),
//       country VARCHAR(100),
//       FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
//     )
//   `;
//   const createContacts = `
//     CREATE TABLE IF NOT EXISTS contacts (
//       contact_id INT AUTO_INCREMENT PRIMARY KEY,
//       name VARCHAR(255),
//       email VARCHAR(255),
//       password VARCHAR(255)
//     )
//   `;

//   db.query(createCompanies, (err) => {
//     if (err) return res.status(500).send("Error creating companies: " + err);
//     db.query(createCustomers, (err2) => {
//       if (err2)
//         return res.status(500).send("Error creating customers: " + err2);
//       db.query(createAddresses, (err3) => {
//         if (err3)
//           return res.status(500).send("Error creating addresses: " + err3);
//         db.query(createContacts, (err4) => {
//           if (err4)
//             return res.status(500).send("Error creating contacts: " + err4);
//           res.send("All tables created successfully!");
//         });
//       });
//     });
//   });
// });

// // Route: add contact
// app.post("/add-contact", (req, res) => {
//   const { name, email, password } = req.body;

//   if (!name || !email || !password) {
//     return res.status(400).send("Please provide name, email, and password.");
//   }

//   const insertQuery =
//     "INSERT INTO contacts (name, email, password) VALUES (?, ?, ?)";
//   db.query(insertQuery, [name, email, password], (err, result) => {
//     if (err) return res.status(500).send(err);

//     res.send({
//       message: "Contact saved successfully!",
//       contact_id: result.insertId,
//     });

//     console.table({ contact_id: result.insertId, name, email });
//   });
// });

// // Route: add company/customer/address
// app.post("/add-data", (req, res) => {
//   const { name, address } = req.body;
//   if (!name || !address)
//     return res.status(400).send("Please provide name and address.");

//   const sqlCompany = "INSERT INTO companies (name) VALUES (?)";
//   db.query(sqlCompany, [name], (err, companyResult) => {
//     if (err) return res.status(500).send(err);
//     const company_id = companyResult.insertId;

//     const sqlCustomer =
//       "INSERT INTO customers (name, company_id) VALUES (?, ?)";
//     db.query(sqlCustomer, [name, company_id], (err, customerResult) => {
//       if (err) return res.status(500).send(err);
//       const customer_id = customerResult.insertId;

//       const sqlAddress =
//         "INSERT INTO addresses (customer_id, address_line) VALUES (?, ?)";
//       db.query(sqlAddress, [customer_id, address], (err, addressResult) => {
//         if (err) return res.status(500).send(err);

//         res.send({
//           message: "Company, customer, and address added successfully!",
//           company_id,
//           customer_id,
//           address_id: addressResult.insertId,
//         });
//       });
//     });
//   });
// });



// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });


import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

dotenv.config();

const app = express();

// configuration
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const isProduction = process.env.NODE_ENV === "production";

//  Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

//  Database Configuration - FIXED: Use proper connection options
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "haymanot-ebabu-portfolio",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  // Remove invalid options for createConnection
};

// Use simple connection (for development) or pool (for production)
let db;

if (isProduction) {
  // For production, use connection pool with proper options
  db = mysql.createPool({
    ...dbConfig,
    connectionLimit: 10,
    acquireTimeout: 60000,
    waitForConnections: true,
    queueLimit: 0,
  });
} else {
  // For development, use simple connection
  db = mysql.createConnection(dbConfig);
}

//  Database Connection Test
if (isProduction) {
  // For connection pool
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection failed:", err.message);
    } else {
      console.log("Connected to MySQL Database with connection pool!");
      connection.release();
    }
  });
} else {
  // For simple connection
  db.connect((err) => {
    if (err) {
      console.error("Database connection failed:", err.message);
    } else {
      console.log("Connected to MySQL Database!");
    }
  });
}

//  Utility Functions
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (isProduction) {
      // For connection pool
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    } else {
      // For simple connection
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }
  });
};

//  Routes

// Health check (required for Render)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: "Connected",
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Server and Database are running!",
    environment: process.env.NODE_ENV || "development",
  });
});

// Create all tables
app.get("/create-all-tables", async (req, res) => {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS companies (
        company_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS customers (
        customer_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS addresses (
        address_id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        address_line VARCHAR(255) NOT NULL,
        city VARCHAR(100),
        country VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS contacts (
        contact_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const tableQuery of tables) {
      await executeQuery(tableQuery);
    }

    res.json({
      success: true,
      message: "All tables created successfully!",
    });
  } catch (error) {
    console.error("Table creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create tables",
      details: error.message,
    });
  }
});

// Add contact
app.post("/add-contact", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide name, email, and password.",
      });
    }

    const insertQuery =
      "INSERT INTO contacts (name, email, password) VALUES (?, ?, ?)";
    const result = await executeQuery(insertQuery, [name, email, password]);

    console.table({ contact_id: result.insertId, name, email });

    res.status(201).json({
      success: true,
      message: "Contact saved successfully!",
      contact_id: result.insertId,
      name,
      email,
    });
  } catch (error) {
    console.error("Add contact error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        error: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to save contact",
      details: error.message,
    });
  }
});

// Add company, customer, and address
app.post("/add-data", async (req, res) => {
  try {
    const { name, address, city, country } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: "Please provide name and address.",
      });
    }

    // Start transaction
    const companyResult = await executeQuery(
      "INSERT INTO companies (name) VALUES (?)",
      [name]
    );
    const company_id = companyResult.insertId;

    const customerResult = await executeQuery(
      "INSERT INTO customers (name, company_id) VALUES (?, ?)",
      [name, company_id]
    );
    const customer_id = customerResult.insertId;

    const addressResult = await executeQuery(
      "INSERT INTO addresses (customer_id, address_line, city, country) VALUES (?, ?, ?, ?)",
      [customer_id, address, city || null, country || null]
    );

    res.status(201).json({
      success: true,
      message: "Company, customer, and address added successfully!",
      data: {
        company_id,
        customer_id,
        address_id: addressResult.insertId,
      },
    });
  } catch (error) {
    console.error("Add data error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add data",
      details: error.message,
    });
  }
});

// Get all contacts
app.get("/contacts", async (req, res) => {
  try {
    const contacts = await executeQuery(
      "SELECT contact_id, name, email, created_at FROM contacts"
    );
    res.json({
      success: true,
      data: contacts,
      count: contacts.length,
    });
  } catch (error) {
    console.error("Get contacts error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch contacts",
    });
  }
});

//  Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

//  Server Startup
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    ` Server running in ${process.env.NODE_ENV || "development"} mode`
  );
  console.log(` Port: ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️ Database: ${isProduction ? "Connection Pool" : "Simple Connection"}`
  );
});