import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../i18n/LanguageContext';

const STAKE_OPTIONS = [
  { id: 'short', icon: '⚡', days: 30,  apr: 8,  color: '#4488FF', enName: 'Short Term', zhName: '短期质押' },
  { id: 'long',  icon: '💎', days: 180, apr: 48, color: '#FFD700', enName: 'Long Term',  zhName: '长期质押', recommended: true },
];

const fmtTpot = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmtDate = (ts) => new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const Staking = () => {
  const { wallet, userTokenBalance, sdk, refreshStats } = useApp();
  const { language } = useTranslation();

  const [selectedOption, setSelectedOption] = useState('long');
  const [stakeAmount, setStakeAmount]       = useState('');
  const [isStaking, setIsStaking]           = useState(false);
  const [actionPending, setActionPending]   = useState(null); // stakeIndex being released/withdrawn
  const [error, setError]                   = useState('');
  const [successMsg, setSuccessMsg]         = useState('');
  const [myStakes, setMyStakes]             = useState([]);
  const [stakingState, setStakingState]     = useState(null);
  const [loadingStakes, setLoadingStakes]   = useState(false);

  const opt = STAKE_OPTIONS.find(o => o.id === selectedOption);
  const estimatedReward = stakeAmount
    ? ((parseFloat(stakeAmount) * opt.apr * opt.days) / 36500).toFixed(2)
    : '0';

  const fetchMyStakes = useCallback(async () => {
    if (!sdk || !wallet.publicKey) return;
    setLoadingStakes(true);
    try {
      const [stakes, state] = await Promise.all([
        sdk.getUserStakes(wallet.publicKey),
        sdk.getStakingState(),
      ]);
      setMyStakes(stakes);
      setStakingState(state);
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoadingStakes(false);
    }
  }, [sdk, wallet.publicKey]);

  useEffect(() => {
    fetchMyStakes();
  }, [fetchMyStakes]);

  const handleStake = async () => {
    if (!wallet.publicKey || !sdk) return;
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      setError(language === 'en' ? 'Please enter a valid amount' : '请输入有效数量');
      return;
    }
    if (userTokenBalance < amount) {
      setError(language === 'en'
        ? `Insufficient balance (${userTokenBalance.toFixed(2)} TPOT available)`
        : `余额不足（可用 ${userTokenBalance.toFixed(2)} TPOT）`);
      return;
    }
    setIsStaking(true);
    setError('');
    setSuccessMsg('');
    try {
      const stakeIndex = Math.floor(Date.now() / 1000);
      const result = await sdk.stake(stakeIndex, amount, selectedOption === 'long');
      if (result.success) {
        setSuccessMsg(language === 'en'
          ? `✅ Staked ${fmtTpot(amount)} TPOT successfully!`
          : `✅ 成功质押 ${fmtTpot(amount)} TPOT！`);
        setStakeAmount('');
        refreshStats();
        await fetchMyStakes();
      } else {
        setError(result.error || (language === 'en' ? 'Staking failed' : '质押失败'));
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
      setIsStaking(false);
    }
  };

  const handleRelease = async (stake) => {
    if (!sdk) return;
    setActionPending(stake.stakeIndex);
    setError('');
    setSuccessMsg('');
    try {
      const result = await sdk.releaseStake(stake.stakeIndex);
      if (result.success) {
        setSuccessMsg(language === 'en'
          ? `🎉 Released ${fmtTpot(stake.amount + stake.reward)} TPOT!`
          : `🎉 已释放 ${fmtTpot(stake.amount + stake.reward)} TPOT！`);
        refreshStats();
        await fetchMyStakes();
      } else {
        setError(result.error || (language === 'en' ? 'Release failed' : '释放失败'));
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
      setActionPending(null);
    }
  };

  const handleEarlyWithdraw = async (stake) => {
    if (!sdk) return;
    setActionPending(stake.stakeIndex);
    setError('');
    setSuccessMsg('');
    try {
      const result = await sdk.earlyWithdraw(stake.stakeIndex);
      if (result.success) {
        setSuccessMsg(language === 'en'
          ? `↩️ Withdrawn ${fmtTpot(stake.amount)} TPOT (principal only — reward forfeited).`
          : `↩️ 已取回 ${fmtTpot(stake.amount)} TPOT 本金（收益已归零）。`);
        refreshStats();
        await fetchMyStakes();
      } else {
        setError(result.error || (language === 'en' ? 'Withdrawal failed' : '提前赎回失败'));
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'Error' : '错误'));
    } finally {
      setActionPending(null);
    }
  };

  const renderStakeCard = (stake) => {
    const now       = Math.floor(Date.now() / 1000);
    const isMature  = now >= stake.endTime;
    const totalDays = stake.stakeType === 'long' ? 180 : 30;
    const elapsed   = Math.min(now - stake.startTime, totalDays * 86400);
    const pct       = Math.min(100, Math.round((elapsed / (totalDays * 86400)) * 100));
    const typeColor = stake.stakeType === 'long' ? '#FFD700' : '#4488FF';
    const typeLabel = stake.stakeType === 'long'
      ? (language === 'en' ? 'Long Term' : '长期')
      : (language === 'en' ? 'Short Term' : '短期');
    const isPending = actionPending === stake.stakeIndex;

    return (
      <div key={stake.stakeIndex} className="sk-stake-card">
        <div className="sk-stake-header">
          <span className="sk-stake-badge" style={{ borderColor: typeColor + '66', color: typeColor }}>
            {stake.stakeType === 'long' ? '💎' : '⚡'} {typeLabel}
          </span>
          {isMature && (
            <span className="sk-mature-tag">
              {language === 'en' ? '✅ Mature' : '✅ 已到期'}
            </span>
          )}
        </div>

        <div className="sk-stake-amounts">
          <div>
            <div className="sk-amt-label">{language === 'en' ? 'Principal' : '本金'}</div>
            <div className="sk-amt-value">{fmtTpot(stake.amount)} TPOT</div>
          </div>
          <div>
            <div className="sk-amt-label">{language === 'en' ? 'Reward' : '收益'}</div>
            <div className="sk-amt-value" style={{ color: '#4ade80' }}>+{fmtTpot(stake.reward)} TPOT</div>
          </div>
          <div>
            <div className="sk-amt-label">{language === 'en' ? 'Total' : '合计'}</div>
            <div className="sk-amt-value" style={{ color: '#FFD700' }}>{fmtTpot(stake.amount + stake.reward)} TPOT</div>
          </div>
        </div>

        <div className="sk-progress-row">
          <span className="sk-date-label">{fmtDate(stake.startTime)}</span>
          <div className="sk-progress-bar">
            <div className="sk-progress-fill" style={{ width: pct + '%', background: typeColor }} />
          </div>
          <span className="sk-date-label">{fmtDate(stake.endTime)}</span>
        </div>
        <div className="sk-pct-label">{pct}% {language === 'en' ? 'elapsed' : '已过'}</div>

        <div className="sk-stake-actions">
          {isMature ? (
            <button
              className="sk-btn-release"
              onClick={() => handleRelease(stake)}
              disabled={isPending}
            >
              {isPending
                ? (language === 'en' ? '⏳ Releasing...' : '⏳ 释放中...')
                : `🎉 ${language === 'en' ? 'Release' : '释放本息'}`}
            </button>
          ) : (
            <button
              className="sk-btn-early"
              onClick={() => handleEarlyWithdraw(stake)}
              disabled={isPending}
            >
              {isPending
                ? (language === 'en' ? '⏳ Withdrawing...' : '⏳ 赎回中...')
                : `↩️ ${language === 'en' ? 'Early Withdraw' : '提前赎回'}`}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '760px' }}>

        {/* Header */}
        <div className="page-header-modern">
          <div className="page-badge">💰 Staking</div>
          <h1 className="page-title-modern">
            {language === 'en' ? 'TPOT Staking' : 'TPOT 质押'}
          </h1>
          <p className="page-subtitle-modern">
            {language === 'en'
              ? 'Lock TPOT for stable returns — auto-released at maturity'
              : '锁定 TPOT 获得稳定收益，到期自动释放'}
          </p>
        </div>

        {/* Pool capacity strip */}
        {stakingState && (
          <div className="sk-capacity-row">
            <div className="sk-capacity-item">
              <span className="sk-capacity-label">⚡ {language === 'en' ? 'Short Term Remaining' : '短期剩余容量'}</span>
              <span className="sk-capacity-value" style={{ color: '#4488FF' }}>
                {fmtTpot(stakingState.shortTermPool - stakingState.totalStakedShort)} TPOT
              </span>
            </div>
            <div className="sk-capacity-divider" />
            <div className="sk-capacity-item">
              <span className="sk-capacity-label">💎 {language === 'en' ? 'Long Term Remaining' : '长期剩余容量'}</span>
              <span className="sk-capacity-value" style={{ color: '#FFD700' }}>
                {fmtTpot(stakingState.longTermPool - stakingState.totalStakedLong)} TPOT
              </span>
            </div>
          </div>
        )}

        {/* Option cards */}
        <div className="sk-options-grid">
          {STAKE_OPTIONS.map(o => (
            <div
              key={o.id}
              className={`sk-option-card${selectedOption === o.id ? ' sk-option-selected' : ''}`}
              style={{ '--opt-color': o.color }}
              onClick={() => setSelectedOption(o.id)}
            >
              {o.recommended && (
                <span className="sk-recommended">🔥 {language === 'en' ? 'Recommended' : '推荐'}</span>
              )}
              <div className="sk-option-icon">{o.icon}</div>
              <div className="sk-option-name">{language === 'en' ? o.enName : o.zhName}</div>
              <div className="sk-option-apr" style={{ color: o.color }}>{o.apr}%</div>
              <div className="sk-option-apr-label">APR</div>
              <div className="sk-option-days">
                {o.days} {language === 'en' ? 'days lock' : '天锁定'}
              </div>
            </div>
          ))}
        </div>

        {/* Stake form */}
        <div className="card card-glass">
          <h2 className="card-title-modern">
            {opt.icon} {language === 'en' ? opt.enName : opt.zhName} — {language === 'en' ? 'Stake TPOT' : '质押 TPOT'}
          </h2>

          {error && (
            <div className="sk-alert-error">⚠️ {error}</div>
          )}
          {successMsg && (
            <div className="sk-alert-success">✅ {successMsg}</div>
          )}

          <div className="sk-form">
            <div className="sk-input-group">
              <label className="sk-label">
                {language === 'en' ? 'Amount' : '质押数量'}
              </label>
              <input
                type="number"
                className="sk-input"
                value={stakeAmount}
                onChange={e => setStakeAmount(e.target.value)}
                placeholder={language === 'en' ? 'Enter TPOT amount' : '输入 TPOT 数量'}
              />
              <span className="sk-balance-hint">
                {language === 'en'
                  ? `Available: ${userTokenBalance?.toLocaleString() ?? 0} TPOT`
                  : `可用余额: ${userTokenBalance?.toLocaleString() ?? 0} TPOT`}
              </span>
            </div>

            {/* Estimate panel */}
            <div className="sk-estimate">
              <div className="sk-estimate-row">
                <span>{language === 'en' ? 'Lock Period' : '锁定期'}</span>
                <span>{opt.days} {language === 'en' ? 'days' : '天'}</span>
              </div>
              <div className="sk-estimate-row">
                <span>APR</span>
                <span style={{ color: opt.color }}>{opt.apr}%</span>
              </div>
              <div className="sk-estimate-row">
                <span>{language === 'en' ? 'Est. Reward' : '预计收益'}</span>
                <span style={{ color: '#4ade80' }}>+{estimatedReward} TPOT</span>
              </div>
              <div className="sk-estimate-row sk-estimate-total">
                <span>{language === 'en' ? 'At Maturity' : '到期总额'}</span>
                <span style={{ color: '#FFD700' }}>
                  {fmtTpot(parseFloat(stakeAmount || 0) + parseFloat(estimatedReward))} TPOT
                </span>
              </div>
            </div>

            {/* Early withdrawal warning */}
            <div className="sk-notice">
              <span className="sk-notice-title">📋 {language === 'en' ? 'Early Withdrawal' : '提前赎回'}</span>
              <span className="sk-notice-body">
                {language === 'en'
                  ? 'Principal returned in full, but rewards are forfeited. Hold to maturity for full returns.'
                  : '可全额取回本金，但收益将归零。建议持有到期享受完整收益。'}
              </span>
            </div>

            <button
              className="sk-btn-stake"
              style={{ '--opt-color': opt.color }}
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || !wallet.publicKey}
            >
              {isStaking
                ? (language === 'en' ? '⏳ Processing...' : '⏳ 处理中...')
                : `💰 ${language === 'en' ? `Stake — ${opt.enName}` : `确认质押 — ${opt.zhName}`}`}
            </button>
          </div>
        </div>

        {/* My Stakes */}
        <div className="card card-glass">
          <div className="sk-stakes-header">
            <h2 className="card-title-modern">📊 {language === 'en' ? 'My Stakes' : '我的质押'}</h2>
            <button className="sk-refresh-btn" onClick={fetchMyStakes} disabled={loadingStakes || !wallet.publicKey}>
              {loadingStakes ? '⏳' : '🔄'}
            </button>
          </div>

          {!wallet.publicKey ? (
            <div className="sk-empty">
              <span>🔗</span>
              <p>{language === 'en' ? 'Connect wallet to view your stakes' : '连接钱包以查看质押记录'}</p>
            </div>
          ) : loadingStakes ? (
            <div className="sk-empty">
              <span>⏳</span>
              <p>{language === 'en' ? 'Loading...' : '加载中...'}</p>
            </div>
          ) : myStakes.length === 0 ? (
            <div className="sk-empty">
              <span>📭</span>
              <p>{language === 'en' ? 'No active stakes' : '暂无进行中的质押'}</p>
              <p className="sk-empty-sub">{language === 'en' ? 'Choose a plan above to start earning' : '在上方选择方案开始赚取收益'}</p>
            </div>
          ) : (
            <div className="sk-stakes-list">
              {myStakes.map(renderStakeCard)}
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="card card-glass">
          <h2 className="card-title-modern">❓ {language === 'en' ? 'Staking FAQ' : '质押常见问题'}</h2>
          <div className="sk-faq-list">
            {[
              {
                q: language === 'en' ? 'Can I withdraw during staking?' : '质押期间可以取回吗？',
                a: language === 'en'
                  ? 'Yes — early withdrawal returns principal only, rewards are forfeited. Principal + rewards are auto-transferred at maturity.'
                  : '可以提前赎回，但仅返还本金，收益归零。到期后系统自动将本金+收益转入您的钱包。',
              },
              {
                q: language === 'en' ? 'How is reward calculated?' : '收益如何计算？',
                a: language === 'en'
                  ? 'Reward = Principal × APR × Days / 365. Short-term (30d): 8% APR. Long-term (180d): 48% APR.'
                  : '收益 = 本金 × 年化率 × 锁定天数 / 365。短期30天8%年化，长期180天48%年化。',
              },
              {
                q: language === 'en' ? 'Is there a staking cap?' : '质押数量有限制吗？',
                a: language === 'en'
                  ? 'Each tier has a total pool cap — first-come-first-served. Available capacity is shown in the strip above the option cards.'
                  : '每档质押有总池上限，先到先得。可用容量显示在选项卡上方的容量栏中。',
              },
            ].map((f, i) => (
              <div key={i} className="sk-faq-item">
                <h4 className="sk-faq-q">Q: {f.q}</h4>
                <p className="sk-faq-a">A: {f.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        /* ── Option grid ─────────────────────────────────────────────── */
        .sk-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        @media (max-width: 480px) { .sk-options-grid { grid-template-columns: 1fr; } }

        .sk-option-card {
          position: relative;
          background: oklch(15% 0.02 280);
          border: 2px solid oklch(30% 0.03 280);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          cursor: pointer;
          text-align: center;
          transition: border-color 0.2s, background 0.2s;
        }
        .sk-option-card:hover { border-color: var(--opt-color); }
        .sk-option-card.sk-option-selected {
          border-color: var(--opt-color);
          background: color-mix(in oklch, var(--opt-color) 10%, oklch(15% 0.02 280));
        }
        .sk-option-icon { font-size: 2.5rem; margin-bottom: var(--space-2); }
        .sk-option-name { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-1); }
        .sk-option-apr { font-size: var(--text-4xl); font-weight: 800; line-height: 1; }
        .sk-option-apr-label { font-size: var(--text-sm); color: var(--text-tertiary); margin-bottom: var(--space-2); }
        .sk-option-days { font-size: var(--text-sm); color: var(--text-secondary); }
        .sk-recommended {
          position: absolute;
          top: var(--space-3);
          right: var(--space-3);
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #000;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-size: var(--text-xs);
          font-weight: 700;
        }

        /* ── Capacity strip ─────────────────────────────────────────── */
        .sk-capacity-row {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          background: oklch(18% 0.02 280);
          border: 1px solid oklch(30% 0.03 280);
          border-radius: var(--radius-lg);
          padding: var(--space-4) var(--space-6);
          margin-bottom: var(--space-4);
        }
        .sk-capacity-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .sk-capacity-label { font-size: var(--text-xs); color: var(--text-tertiary); }
        .sk-capacity-value { font-size: var(--text-base); font-weight: 700; }
        .sk-capacity-divider { width: 1px; height: 32px; background: oklch(30% 0.03 280); }

        /* ── Form ──────────────────────────────────────────────────── */
        .sk-form { display: flex; flex-direction: column; gap: var(--space-4); }
        .sk-input-group { display: flex; flex-direction: column; gap: var(--space-2); }
        .sk-label { font-size: var(--text-sm); color: var(--text-tertiary); }
        .sk-input {
          background: oklch(12% 0.02 280);
          border: 1px solid oklch(35% 0.03 280);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-xl);
          color: var(--text-primary);
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        .sk-input:focus { border-color: var(--color-gold); }
        .sk-balance-hint { font-size: var(--text-xs); color: var(--text-tertiary); text-align: right; }

        .sk-estimate {
          background: oklch(13% 0.02 280);
          border-radius: var(--radius-md);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .sk-estimate-row {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
        .sk-estimate-total {
          border-top: 1px solid oklch(30% 0.03 280);
          padding-top: var(--space-2);
          margin-top: var(--space-1);
          font-weight: 700;
          font-size: var(--text-base);
        }

        .sk-notice {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          background: oklch(20% 0.05 15 / 0.4);
          border: 1px solid oklch(35% 0.08 15 / 0.5);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
        }
        .sk-notice-title { font-size: var(--text-sm); font-weight: 600; color: #FF4444; }
        .sk-notice-body { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.5; }

        .sk-btn-stake {
          width: 100%;
          padding: var(--space-4);
          font-size: var(--text-lg);
          font-weight: 700;
          background: linear-gradient(135deg, var(--opt-color), color-mix(in oklch, var(--opt-color) 70%, transparent));
          color: oklch(10% 0.02 280);
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .sk-btn-stake:hover:not(:disabled) { opacity: 0.88; }
        .sk-btn-stake:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Alerts ────────────────────────────────────────────────── */
        .sk-alert-error {
          color: #ff4444;
          background: oklch(20% 0.06 15 / 0.3);
          border: 1px solid oklch(35% 0.1 15 / 0.5);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: var(--text-sm);
          margin-bottom: var(--space-3);
        }
        .sk-alert-success {
          color: #4ade80;
          background: oklch(20% 0.06 145 / 0.2);
          border-radius: var(--radius-md);
          padding: var(--space-3);
          font-size: var(--text-sm);
          margin-bottom: var(--space-3);
        }

        /* ── My Stakes section ─────────────────────────────────────── */
        .sk-stakes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }
        .sk-stakes-header .card-title-modern { margin-bottom: 0; }
        .sk-refresh-btn {
          background: none;
          border: 1px solid oklch(35% 0.03 280);
          border-radius: var(--radius-md);
          padding: var(--space-1) var(--space-3);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: var(--text-base);
          transition: border-color 0.2s;
        }
        .sk-refresh-btn:hover:not(:disabled) { border-color: var(--color-gold); }
        .sk-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .sk-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-10);
          color: var(--text-tertiary);
          gap: var(--space-2);
          font-size: 2rem;
        }
        .sk-empty p { font-size: var(--text-base); margin: 0; }
        .sk-empty-sub { font-size: var(--text-sm) !important; }

        .sk-stakes-list { display: flex; flex-direction: column; gap: var(--space-4); }

        .sk-stake-card {
          background: oklch(14% 0.02 280);
          border: 1px solid oklch(28% 0.03 280);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
        }
        .sk-stake-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }
        .sk-stake-badge {
          display: inline-block;
          border: 1px solid;
          border-radius: var(--radius-sm);
          padding: 2px 8px;
          font-size: var(--text-sm);
          font-weight: 600;
        }
        .sk-mature-tag {
          font-size: var(--text-xs);
          color: #4ade80;
          background: oklch(20% 0.06 145 / 0.3);
          border-radius: var(--radius-sm);
          padding: 2px 8px;
        }

        .sk-stake-amounts {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .sk-amt-label { font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: 2px; }
        .sk-amt-value { font-size: var(--text-base); font-weight: 700; }

        .sk-progress-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-1);
        }
        .sk-date-label { font-size: var(--text-xs); color: var(--text-tertiary); white-space: nowrap; }
        .sk-progress-bar {
          flex: 1;
          height: 6px;
          background: oklch(25% 0.03 280);
          border-radius: 3px;
          overflow: hidden;
        }
        .sk-progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
        .sk-pct-label { font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: var(--space-3); }

        .sk-stake-actions { display: flex; gap: var(--space-2); }
        .sk-btn-release, .sk-btn-early {
          flex: 1;
          padding: var(--space-2) var(--space-4);
          font-size: var(--text-sm);
          font-weight: 600;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .sk-btn-release {
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: #000;
        }
        .sk-btn-early {
          background: oklch(22% 0.03 280);
          border: 1px solid oklch(35% 0.04 280);
          color: var(--text-secondary);
        }
        .sk-btn-release:hover:not(:disabled), .sk-btn-early:hover:not(:disabled) { opacity: 0.85; }
        .sk-btn-release:disabled, .sk-btn-early:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── FAQ ──────────────────────────────────────────────────── */
        .sk-faq-list { display: flex; flex-direction: column; gap: var(--space-4); }
        .sk-faq-item {
          background: oklch(14% 0.02 280);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }
        .sk-faq-q { font-size: var(--text-sm); color: var(--color-gold); margin-bottom: var(--space-2); }
        .sk-faq-a { font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.6; margin: 0; }
      `}</style>
    </div>
  );
};

export default Staking;
