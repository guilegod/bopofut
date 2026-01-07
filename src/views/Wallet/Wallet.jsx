import { useState } from "react";
import styles from "./wallet.module.css";

import WalletHeader from "./components/WalletHeader.jsx";
import BalanceCard from "./components/BalanceCard.jsx";
import RechargeSection from "./components/RechargeSection.jsx";
import TransactionsList from "./components/TransactionsList.jsx";

export default function Wallet({ user, setUser, onBack }) {
  const [amount, setAmount] = useState("50");

  function handleAddBalance() {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) return;

    setUser({
      ...user,
      walletBalance: user.walletBalance + value,
    });

    alert("Bópô Créditos adicionados com sucesso!");
  }

  return (
    <div className={styles.page}>
      <WalletHeader onBack={onBack} />

      <BalanceCard balance={user.walletBalance} />

      <RechargeSection
        amount={amount}
        setAmount={setAmount}
        onConfirm={handleAddBalance}
      />

      <TransactionsList />
    </div>
  );
}
