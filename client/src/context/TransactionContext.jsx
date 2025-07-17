import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress, donationAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

// Create Ethereum contract instance
const createEthereumContract = () => {
  if (!ethereum) {
    console.error("Ethereum object not found! Install MetaMask.");
    return null;
  }
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

export const TransactionsProvider = ({ children }) => {
  const [formData, setFormData] = useState({ amount: "", message: "" });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount") || 0);
  const [transactions, setTransactions] = useState([]);

  // Handle input changes
  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  // Fetch all transactions
  const getAllTransactions = async () => {
    if (!ethereum) return console.log("Ethereum object not found");

    try {
      const transactionsContract = createEthereumContract();
      if (!transactionsContract) return;

      const availableTransactions = await transactionsContract.getAllTransactions();
      const structuredTransactions = availableTransactions.map((tx) => ({
        addressTo: tx.receiver,
        addressFrom: tx.sender,
        timestamp: new Date(tx.timestamp.toNumber() * 1000).toLocaleString(),
        message: tx.message,
        keyword: tx.keyword,
        amount: ethers.utils.formatEther(tx.amount._hex),
      }));

      setTransactions(structuredTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  // Check if MetaMask wallet is connected
  const checkIfWalletIsConnected = async () => {
    if (!ethereum) {
      alert("MetaMask is required. Please install it.");
      return;
    }

    try {
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        await getAllTransactions();
      } else {
        console.log("No connected accounts found.");
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  // Check if transactions exist
  const checkIfTransactionsExist = async () => {
    if (!ethereum) return;

    try {
      const transactionsContract = createEthereumContract();
      if (!transactionsContract) return;

      const currentTransactionCount = await transactionsContract.getTransactionCount();
      localStorage.setItem("transactionCount", currentTransactionCount.toString());
    } catch (error) {
      console.error("Error checking transactions:", error);
    }
  };

  // Connect MetaMask Wallet
  const connectWallet = async () => {
    if (!ethereum) {
      alert("MetaMask is required. Please install it.");
      return;
    }

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  // Send a transaction
  const sendTransaction = async () => {
    if (!ethereum) return console.log("Ethereum object not found");

    try {
      const { amount, message } = formData;
      const transactionsContract = createEthereumContract();
      if (!transactionsContract) return;

      const parsedAmount = ethers.utils.parseEther(amount);
      const keyword = "donation";
      const addressTo = donationAddress;

      console.log("Sending Transaction...");

      await ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: currentAccount,
          to: addressTo,
          gas: "0x5208",
          value: parsedAmount._hex,
        }],
      });

      const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

      setIsLoading(true);
      console.log(`Transaction Submitted - ${transactionHash.hash}`);

      await transactionHash.wait();

      console.log(`Transaction Confirmed - ${transactionHash.hash}`);
      setIsLoading(false);

      setTransactions((prev) => [...prev, {
        addressFrom: currentAccount,
        addressTo,
        amount,
        message,
        timestamp: new Date().toLocaleString(),
      }]);

      const transactionsCount = await transactionsContract.getTransactionCount();
      setTransactionCount(transactionsCount.toNumber());
      localStorage.setItem("transactionCount", transactionsCount.toString());

    } catch (error) {
      console.error("Transaction Error:", error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionsExist();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
