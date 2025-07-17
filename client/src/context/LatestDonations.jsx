import React, { useContext } from "react";
import { TransactionContext } from "../context/TransactionContext";

const LatestDonations = () => {
    const { transactions } = useContext(TransactionContext);

    return (
        <div>
            <h2>Latest Donations</h2>
            {transactions.length === 0 ? (
                <p>No recent transactions</p>
            ) : (
                <ul>
                    {transactions.map((tx, index) => (
                        <li key={index}>
                            <p><strong>Txn Hash:</strong> {tx.txHash}</p>
                            <p><strong>Sender:</strong> {tx.sender}</p>
                            <p><strong>Amount:</strong> {tx.amount} ETH</p>
                            <p><strong>Message:</strong> {tx.message}</p>
                            <p><strong>Date:</strong> {tx.timestamp}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LatestDonations;
