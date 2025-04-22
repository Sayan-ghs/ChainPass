import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const TransactionContext = createContext(null);

// Transaction status enum
export const TX_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  REJECTED: 'REJECTED'
};

// Transaction notification component
const TransactionNotification = ({ tx, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(tx.autoClose ? 5 : null);
  
  useEffect(() => {
    if (!timeLeft) return;
    
    const timer = setTimeout(() => {
      if (timeLeft > 1) {
        setTimeLeft(timeLeft - 1);
      } else {
        onClose(tx.id);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, onClose, tx.id]);
  
  // Status-based styling
  const getStatusStyles = () => {
    switch (tx.status) {
      case TX_STATUS.PENDING:
        return {
          container: 'border-blue-300 bg-blue-50',
          icon: (
            <div className="mr-3 w-6 h-6 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ),
          title: 'Transaction Pending',
          color: 'text-blue-700'
        };
      case TX_STATUS.SUCCESS:
        return {
          container: 'border-green-300 bg-green-50',
          icon: (
            <div className="mr-3 w-6 h-6 flex items-center justify-center text-green-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          title: 'Transaction Successful',
          color: 'text-green-700'
        };
      case TX_STATUS.ERROR:
        return {
          container: 'border-red-300 bg-red-50',
          icon: (
            <div className="mr-3 w-6 h-6 flex items-center justify-center text-red-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
          title: 'Transaction Failed',
          color: 'text-red-700'
        };
      case TX_STATUS.REJECTED:
        return {
          container: 'border-yellow-300 bg-yellow-50',
          icon: (
            <div className="mr-3 w-6 h-6 flex items-center justify-center text-yellow-500">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ),
          title: 'Transaction Rejected',
          color: 'text-yellow-700'
        };
      default:
        return {
          container: 'border-gray-300 bg-gray-50',
          icon: null,
          title: 'Transaction',
          color: 'text-gray-700'
        };
    }
  };
  
  const styles = getStatusStyles();
  
  return (
    <div className={`border-l-4 p-4 mb-3 rounded-md shadow-sm ${styles.container} transition-all duration-300 transform hover:shadow-md`}>
      <div className="flex items-start">
        {styles.icon}
        <div className="flex-1">
          <h3 className={`font-medium ${styles.color}`}>
            {styles.title}
          </h3>
          <p className="text-sm mt-1">
            {tx.message}
          </p>
          {tx.hash && (
            <a 
              href={`https://sepolia.basescan.org/tx/${tx.hash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs mt-1 inline-block text-blue-600 hover:underline"
            >
              View on BaseScan
            </a>
          )}
        </div>
        <button 
          onClick={() => onClose(tx.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {timeLeft && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full ${tx.status === TX_STATUS.PENDING ? 'bg-blue-500' : tx.status === TX_STATUS.SUCCESS ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${(timeLeft / 5) * 100}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

// Provider component
export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  
  // Add a new transaction notification
  const addTransaction = (transaction) => {
    const newTx = {
      id: Date.now(), // Unique ID for the transaction
      timestamp: new Date().toISOString(),
      status: TX_STATUS.PENDING,
      message: 'Processing transaction...',
      autoClose: true,
      ...transaction
    };
    
    setTransactions(prev => [newTx, ...prev]);
    return newTx.id;
  };
  
  // Update an existing transaction
  const updateTransaction = (id, updates) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === id ? { ...tx, ...updates } : tx
      )
    );
  };
  
  // Remove a transaction
  const removeTransaction = (id) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };
  
  // Value object with all the methods and state
  const value = {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction
  };
  
  return (
    <TransactionContext.Provider value={value}>
      {children}
      {/* Transaction notification container */}
      {transactions.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 z-50 space-y-2 max-h-screen overflow-y-auto pb-4">
          {transactions.map(tx => (
            <TransactionNotification 
              key={tx.id} 
              tx={tx} 
              onClose={removeTransaction} 
            />
          ))}
        </div>
      )}
    </TransactionContext.Provider>
  );
};

// Custom hook for easier consumption
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}; 