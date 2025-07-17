const path = require("path");
const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors()); // Allow frontend to communicate with backend

// Define the correct path for transactions.json
const transactionsFile = path.join(__dirname, "transactions.json");

// Load transactions from JSON file
const loadTransactions = () => {
  try {
    if (!fs.existsSync(transactionsFile)) {
      fs.writeFileSync(transactionsFile, JSON.stringify([]), "utf-8");
      return [];
    }
    const data = fs.readFileSync(transactionsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Error reading transactions file:", error);
    return [];
  }
};

// Save transactions to JSON file
const saveTransaction = (transaction) => {
  try {
    let transactions = loadTransactions();
    transactions.push(transaction);

    // ✅ Synchronous write to ensure the file is updated
    fs.writeFileSync(transactionsFile, JSON.stringify(transactions, null, 2), "utf-8");

    console.log("✅ Transaction saved successfully!");
  } catch (error) {
    console.error("❌ Error saving transaction:", error);
  }
};

// API to store transactions
app.post("/transactions", (req, res) => {
  const transaction = req.body;
  
  if (!transaction || Object.keys(transaction).length === 0) {
    return res.status(400).send({ success: false, message: "Invalid transaction data." });
  }
  
  saveTransaction(transaction);
  res.status(200).send({ success: true, message: "Transaction saved." });
});

// API to fetch all transactions
app.get("/transactions", (req, res) => {
  res.status(200).json(loadTransactions());
});

app.listen(5004, () => console.log("🚀 Server running on port 5004"));
