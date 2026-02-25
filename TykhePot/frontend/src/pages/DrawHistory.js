import React, { useState, useEffect, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';
import { POOL_TYPE, POOL_CONFIG, PROGRAM_ID } from '../config/contract';
import { getPoolStatePda } from '../utils/tykhepot-sdk';

const POOL_LABELS = {
  [POOL_TYPE.MIN30]:  { icon: '⏱️', en: '30 Min', zh: '30分钟' },
  [POOL_TYPE.HOURLY]: { icon: '⏰', en: 'Hourly',  zh: '小时'   },
  [POOL_TYPE.DAILY]:  { icon: '🌙', en: 'Daily',   zh: '每日'   },
};

const HISTORY_LIMIT = 5;

// Shorten a base58 address to "XXXX...XXXX"
function shortAddr(addr) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

// Format unix timestamp (seconds) to locale string
function fmtTime(ts) {
  if (!ts) return '--';
  return new Date(ts * 1000).toLocaleString();
}

// Format TPOT amount (raw u64 lamports → TPOT)
function fmtTpot(raw) {
  return (Number(raw) / 1e9).toFixed(2);
}

async function fetchDrawHistory(connection, sdk, poolType) {
  const [poolStatePda] = getPoolStatePda(poolType);
  const program = sdk?.program;
  if (!program) return [];

  let sigs;
  try {
    sigs = await connection.getSignaturesForAddress(poolStatePda, { limit: 40 });
  } catch {
    return [];
  }

  const draws = [];
  for (const sigInfo of sigs) {
    if (draws.length >= HISTORY_LIMIT) break;
    if (sigInfo.err) continue; // skip failed txs

    let tx;
    try {
      tx = await connection.getTransaction(sigInfo.signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });
    } catch { continue; }

    const logs = tx?.meta?.logMessages || [];
    for (const log of logs) {
      if (!log.startsWith('Program data: ')) continue;
      const b64 = log.slice('Program data: '.length);
      try {
        const event = program.coder.events.decode(b64);
        if (!event) continue;

        if (event.name === 'DrawExecuted' && event.data.poolType === poolType) {
          draws.push({
            kind:             'success',
            signature:        sigInfo.signature,
            blockTime:        sigInfo.blockTime,
            roundNumber:      event.data.roundNumber.toNumber(),
            winner:           event.data.winner.toBase58(),
            prizeAmount:      fmtTpot(event.data.prizeAmount),
            totalPool:        fmtTpot(event.data.totalPool),
            participantCount: event.data.participantCount,
          });
          break;
        }

        if (event.name === 'RoundRefunded' && event.data.poolType === poolType) {
          draws.push({
            kind:             'refunded',
            signature:        sigInfo.signature,
            blockTime:        sigInfo.blockTime,
            roundNumber:      event.data.roundNumber.toNumber(),
            participantCount: event.data.regularRefunded + event.data.freeCarriedOver,
            totalRefunded:    fmtTpot(event.data.totalRefunded),
          });
          break;
        }
      } catch {}
    }
  }
  return draws;
}

const DrawHistory = () => {
  const { connection, sdk } = useApp();
  const { language } = useTranslation();
  const [activePool, setActivePool] = useState(POOL_TYPE.HOURLY);
  const [historyMap, setHistoryMap] = useState({
    [POOL_TYPE.MIN30]:  null,
    [POOL_TYPE.HOURLY]: null,
    [POOL_TYPE.DAILY]:  null,
  });
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async (poolType) => {
    if (!connection || !sdk) return;
    setLoading(true);
    try {
      const data = await fetchDrawHistory(connection, sdk, poolType);
      setHistoryMap(prev => ({ ...prev, [poolType]: data }));
    } catch {
      setHistoryMap(prev => ({ ...prev, [poolType]: [] }));
    } finally {
      setLoading(false);
    }
  }, [connection, sdk]);

  // Load active pool history on tab change
  useEffect(() => {
    if (historyMap[activePool] === null) {
      loadHistory(activePool);
    }
  }, [activePool, historyMap, loadHistory]);

  const draws = historyMap[activePool] || [];
  const pl = POOL_LABELS[activePool];

  return (
    <div className="page-container">
      <div className="container">

        {/* Header */}
        <div className="dh-header">
          <div className="page-badge">📋 {language === 'en' ? 'Draw Records' : '开奖记录'}</div>
          <h1 className="page-title-modern">
            {language === 'en' ? 'Draw History' : '开奖历史'}
          </h1>
          <p className="page-subtitle-modern">
            {language === 'en'
              ? 'Last 5 completed rounds per pool — results recorded on-chain'
              : '每个奖池最近5期开奖结果，数据全程上链可验证'}
          </p>
        </div>

        {/* Pool Tabs */}
        <div className="dh-tabs">
          {[POOL_TYPE.MIN30, POOL_TYPE.HOURLY, POOL_TYPE.DAILY].map(pt => {
            const l = POOL_LABELS[pt];
            return (
              <button
                key={pt}
                className={`dh-tab ${activePool === pt ? 'active' : ''}`}
                onClick={() => setActivePool(pt)}
              >
                {l.icon} {language === 'en' ? l.en : l.zh}
                {historyMap[pt] !== null && (
                  <span className="dh-tab-count">
                    {historyMap[pt].length}
                  </span>
                )}
              </button>
            );
          })}
          <button
            className="dh-refresh-btn"
            onClick={() => loadHistory(activePool)}
            disabled={loading}
            title={language === 'en' ? 'Refresh' : '刷新'}
          >
            {loading ? '⏳' : '🔄'}
          </button>
        </div>

        {/* Content */}
        <div className="card card-glass dh-content">
          {loading && historyMap[activePool] === null ? (
            <div className="dh-loading">
              <div className="dh-spinner" />
              <p>{language === 'en' ? 'Loading draw history...' : '加载开奖记录中...'}</p>
            </div>
          ) : draws.length === 0 ? (
            <div className="dh-empty">
              <div className="dh-empty-icon">📭</div>
              <p className="dh-empty-title">
                {language === 'en' ? 'No records yet' : '暂无开奖记录'}
              </p>
              <p className="dh-empty-desc">
                {language === 'en'
                  ? 'Draw history will appear here after the first draw is completed.'
                  : '首次开奖完成后，记录将显示在这里。'}
              </p>
            </div>
          ) : (
            <div className="dh-list">
              {draws.map((draw, idx) => (
                <div
                  key={draw.signature}
                  className={`dh-item ${draw.kind === 'success' ? 'dh-item-success' : 'dh-item-refunded'}`}
                >
                  {/* Round badge + status */}
                  <div className="dh-item-top">
                    <div className="dh-round-badge">
                      #{draw.roundNumber}
                    </div>
                    <div className={`dh-status ${draw.kind}`}>
                      {draw.kind === 'success'
                        ? (language === 'en' ? '✅ Draw Completed' : '✅ 开奖成功')
                        : (language === 'en' ? '⚠️ Round Refunded' : '⚠️ 未达人数·退款')}
                    </div>
                    <div className="dh-time">{fmtTime(draw.blockTime)}</div>
                  </div>

                  {/* Detail grid */}
                  <div className="dh-grid">
                    <div className="dh-cell">
                      <span className="dh-cell-label">
                        {language === 'en' ? 'Participants' : '参与人数'}
                      </span>
                      <span className="dh-cell-value">{draw.participantCount}</span>
                    </div>

                    {draw.kind === 'success' ? (
                      <>
                        <div className="dh-cell">
                          <span className="dh-cell-label">
                            {language === 'en' ? 'Total Pool' : '总奖池'}
                          </span>
                          <span className="dh-cell-value dh-gold">{draw.totalPool} TPOT</span>
                        </div>
                        <div className="dh-cell">
                          <span className="dh-cell-label">
                            {language === 'en' ? 'Prize (95%)' : '奖金(95%)'}
                          </span>
                          <span className="dh-cell-value dh-gold">{draw.prizeAmount} TPOT</span>
                        </div>
                        <div className="dh-cell dh-cell-wide">
                          <span className="dh-cell-label">
                            {language === 'en' ? 'Winner' : '获奖者'}
                          </span>
                          <a
                            className="dh-cell-value dh-winner"
                            href={`https://solscan.io/account/${draw.winner}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {shortAddr(draw.winner)}
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="dh-cell">
                        <span className="dh-cell-label">
                          {language === 'en' ? 'Total Refunded' : '退款总额'}
                        </span>
                        <span className="dh-cell-value">{draw.totalRefunded} TPOT</span>
                      </div>
                    )}

                    <div className="dh-cell dh-cell-tx">
                      <span className="dh-cell-label">Tx</span>
                      <a
                        className="dh-cell-value dh-tx"
                        href={`https://solscan.io/tx/${draw.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {shortAddr(draw.signature)}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explainer */}
        <div className="card card-glass dh-explainer">
          <h3>{language === 'en' ? '🔍 How Draws Work' : '🔍 开奖机制说明'}</h3>
          <div className="dh-explain-grid">
            {[
              {
                icon: '⏰',
                en: 'Auto-triggered at each UTC interval (30min / 1h / 24h)',
                zh: '每个 UTC 整点自动触发开奖（30分 / 1小时 / 24小时）',
              },
              {
                icon: '👥',
                en: 'Minimum 12 participants required for prize distribution',
                zh: '至少12人参与才能成功开奖并分发奖金',
              },
              {
                icon: '⚖️',
                en: 'Equal probability — 1 wallet = 1 chance, regardless of deposit amount',
                zh: '等概率 — 每个钱包中奖概率相同，与投注金额无关',
              },
              {
                icon: '🔥',
                en: 'On success: 95% to winner · 3% burned · 2% platform',
                zh: '开奖成功：95% 归获胜者 · 3% 销毁 · 2% 平台',
              },
              {
                icon: '♻️',
                en: 'On failure (<12): regular bets refunded · free bets carry over',
                zh: '不满12人：普通投注原路退款 · 免费投注自动续到下期',
              },
            ].map((item, i) => (
              <div key={i} className="dh-explain-item">
                <span className="dh-explain-icon">{item.icon}</span>
                <span>{language === 'en' ? item.en : item.zh}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .dh-header {
          text-align: center;
          padding: var(--space-12) 0 var(--space-6);
        }

        .dh-tabs {
          display: flex;
          gap: var(--space-2);
          margin-bottom: var(--space-6);
          align-items: center;
          flex-wrap: wrap;
        }

        .dh-tab {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-5);
          background: oklch(15% 0.02 280);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .dh-tab:hover {
          border-color: oklch(55% 0.2 270 / 0.5);
          color: var(--text-primary);
        }

        .dh-tab.active {
          background: oklch(55% 0.2 270 / 0.2);
          border-color: var(--color-gold);
          color: var(--color-gold);
        }

        .dh-tab-count {
          background: var(--color-gold);
          color: oklch(10% 0.02 280);
          font-size: var(--text-xs);
          font-weight: 700;
          padding: 1px 6px;
          border-radius: var(--radius-full);
          min-width: 18px;
          text-align: center;
        }

        .dh-refresh-btn {
          margin-left: auto;
          padding: var(--space-2) var(--space-3);
          background: transparent;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-base);
          transition: all var(--transition-fast);
        }

        .dh-refresh-btn:hover:not(:disabled) {
          border-color: var(--color-gold);
        }

        .dh-refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dh-content {
          min-height: 300px;
          margin-bottom: var(--space-6);
        }

        .dh-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          gap: var(--space-4);
          color: var(--text-secondary);
        }

        .dh-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid oklch(30% 0.03 280);
          border-top-color: var(--color-gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .dh-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-16);
          gap: var(--space-3);
          text-align: center;
        }

        .dh-empty-icon { font-size: 3rem; }

        .dh-empty-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-secondary);
          margin: 0;
        }

        .dh-empty-desc {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          margin: 0;
        }

        .dh-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .dh-item {
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          border: 1px solid transparent;
        }

        .dh-item-success {
          background: oklch(18% 0.03 140 / 0.3);
          border-color: oklch(50% 0.15 140 / 0.3);
        }

        .dh-item-refunded {
          background: oklch(18% 0.02 280 / 0.5);
          border-color: oklch(40% 0.02 280 / 0.3);
        }

        .dh-item-top {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-3);
          flex-wrap: wrap;
        }

        .dh-round-badge {
          background: oklch(55% 0.2 270 / 0.2);
          color: var(--color-gold);
          font-size: var(--text-sm);
          font-weight: 700;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          font-family: var(--font-mono);
        }

        .dh-status {
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .dh-status.success { color: #4ade80; }
        .dh-status.refunded { color: #facc15; }

        .dh-time {
          margin-left: auto;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .dh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--space-3);
        }

        .dh-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dh-cell-wide {
          grid-column: span 2;
        }

        .dh-cell-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .dh-cell-value {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .dh-gold { color: var(--color-gold); }

        .dh-winner, .dh-tx {
          color: #60a5fa;
          text-decoration: none;
          font-family: var(--font-mono);
        }

        .dh-winner:hover, .dh-tx:hover {
          text-decoration: underline;
        }

        .dh-explainer {
          margin-top: var(--space-6);
        }

        .dh-explainer h3 {
          font-size: var(--text-lg);
          font-weight: 600;
          margin-bottom: var(--space-4);
          color: var(--text-primary);
        }

        .dh-explain-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .dh-explain-item {
          display: flex;
          gap: var(--space-3);
          align-items: flex-start;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .dh-explain-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
          margin-top: 1px;
        }

        @media (max-width: 640px) {
          .dh-tabs { gap: var(--space-2); }
          .dh-grid { grid-template-columns: 1fr 1fr; }
          .dh-cell-wide { grid-column: span 2; }
          .dh-time { margin-left: 0; }
        }
      `}</style>
    </div>
  );
};

export default DrawHistory;
