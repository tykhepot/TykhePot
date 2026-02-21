import React, { useState, useEffect } from 'react';
import useTykhePot from '../hooks/useTykhePot';

const ContractTest = () => {
  const {
    isConnected,
    isLoading,
    error,
    publicKey,
    getBalance,
    getProtocolState,
    getUserState,
    depositHourly,
    depositDaily,
    claimVested,
    formatAmount,
  } = useTykhePot();

  const [balance, setBalance] = useState(BigInt(0));
  const [protocolState, setProtocolState] = useState(null);
  const [userState, setUserState] = useState(null);
  const [depositAmount, setDepositAmount] = useState('200');
  const [lastTx, setLastTx] = useState(null);

  // 加载数据
  useEffect(() => {
    if (isConnected) {
      loadData();
    }
  }, [isConnected]);

  const loadData = async () => {
    const bal = await getBalance();
    setBalance(bal);

    const state = await getProtocolState();
    setProtocolState(state);

    const user = await getUserState();
    setUserState(user);
  };

  const handleDepositHourly = async () => {
    const result = await depositHourly(depositAmount);
    if (result.success) {
      setLastTx(result.tx);
      alert(`参与成功! 交易: ${result.tx}`);
      loadData();
    } else {
      alert(`参与失败: ${result.error}`);
    }
  };

  const handleDepositDaily = async () => {
    const result = await depositDaily(depositAmount);
    if (result.success) {
      setLastTx(result.tx);
      alert(`参与成功! 交易: ${result.tx}`);
      loadData();
    } else {
      alert(`参与失败: ${result.error}`);
    }
  };

  const handleClaim = async () => {
    const result = await claimVested();
    if (result.success) {
      setLastTx(result.tx);
      alert(`领取成功! 交易: ${result.tx}`);
      loadData();
    } else {
      alert(`领取失败: ${result.error}`);
    }
  };

  if (!isConnected) {
    return (
      <div style={styles.container}>
        <h2>合约测试</h2>
        <p>请先连接钱包</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>🧪 合约集成测试</h2>
      
      {error && (
        <div style={styles.error}>
          错误: {error}
        </div>
      )}

      <div style={styles.section}>
        <h3>钱包信息</h3>
        <p>地址: {publicKey?.toString()}</p>
        <p>余额: {formatAmount(balance)} TPOT</p>
        <button onClick={loadData} disabled={isLoading}>
          刷新数据
        </button>
      </div>

      <div style={styles.section}>
        <h3>协议状态</h3>
        {protocolState ? (
          <div>
            <p>小时池: {formatAmount(protocolState.hourlyPool?.totalAmount || 0)} TPOT</p>
            <p>天池: {formatAmount(protocolState.dailyPool?.totalAmount || 0)} TPOT</p>
            <p>总销毁: {formatAmount(protocolState.totalBurned || 0)} TPOT</p>
          </div>
        ) : (
          <p>未获取到协议状态</p>
        )}
      </div>

      <div style={styles.section}>
        <h3>用户状态</h3>
        {userState ? (
          <div>
            <p>小时池票数: {userState.hourlyTickets?.toString() || 0}</p>
            <p>天池票数: {userState.dailyTickets?.toString() || 0}</p>
          </div>
        ) : (
          <p>未获取到用户状态 (可能需要先参与)</p>
        )}
      </div>

      <div style={styles.section}>
        <h3>测试操作</h3>
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="金额 (TPOT)"
          style={styles.input}
        />
        <div style={styles.buttons}>
          <button onClick={handleDepositHourly} disabled={isLoading}>
            {isLoading ? '处理中...' : '参与小时池'}
          </button>
          <button onClick={handleDepositDaily} disabled={isLoading}>
            {isLoading ? '处理中...' : '参与天池'}
          </button>
          <button onClick={handleClaim} disabled={isLoading}>
            {isLoading ? '处理中...' : '领取奖金'}
          </button>
        </div>
      </div>

      {lastTx && (
        <div style={styles.section}>
          <h3>最近交易</h3>
          <p>交易哈希: {lastTx}</p>
          <a 
            href={`https://solscan.io/tx/${lastTx}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            在 Solscan 查看
          </a>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    background: '#1a1a2e',
    padding: '20px',
    marginBottom: '20px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 215, 0, 0.2)',
  },
  error: {
    background: '#ff4444',
    color: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    marginBottom: '10px',
    width: '200px',
    background: '#2a2a3e',
    border: '1px solid #444',
    color: 'white',
    borderRadius: '4px',
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
};

export default ContractTest;
