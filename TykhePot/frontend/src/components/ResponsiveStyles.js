/* 响应式组件样式 - 专业移动端适配 */

/* ==================== 通用容器 ==================== */
.page-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}

.page-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #A0A0A0;
}

/* ==================== 卡片网格 ==================== */
.card-grid {
  display: grid;
  gap: 1rem;
  width: 100%;
}

.card-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.card-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.card-grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

/* ==================== 统计卡片 ==================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 215, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.stat-label {
  font-size: 0.7rem;
  color: #A0A0A0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #FFD700;
}

/* ==================== 内容卡片 ==================== */
.content-card {
  background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%);
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(255, 215, 0, 0.2);
  margin-bottom: 1rem;
  width: 100%;
  overflow: hidden;
}

.card-title {
  font-size: 1rem;
  color: #FFD700;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

/* ==================== 表单元素 ==================== */
.form-group {
  margin-bottom: 0.75rem;
  width: 100%;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  color: #A0A0A0;
  margin-bottom: 0.4rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #2D2D44;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
}

.form-input:focus {
  outline: none;
  border-color: #FFD700;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.1);
}

/* ==================== 按钮 ==================== */
.btn-block {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary-gradient {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
}

.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #512da8, #00d4ff);
  color: #fff;
}

/* ==================== 快速金额按钮 ==================== */
.quick-amount-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.quick-amount-btn {
  flex: 1;
  min-width: 60px;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #2D2D44;
  border-radius: 6px;
  color: #A0A0A0;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-amount-btn:hover {
  border-color: #FFD700;
  color: #FFD700;
}

/* ==================== 信息列表 ==================== */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #A0A0A0;
  font-size: 0.8rem;
}

.info-value {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
}

/* ==================== 倒计时 ==================== */
.countdown-box {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  margin: 0.75rem 0;
}

.countdown-label {
  font-size: 0.7rem;
  color: #A0A0A0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.25rem;
}

.countdown-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFD700;
  font-family: 'Courier New', monospace;
}

/* ==================== 奖池显示 ==================== */
.pool-display {
  text-align: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.pool-label {
  display: block;
  font-size: 0.7rem;
  color: #A0A0A0;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.pool-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #FFD700;
}

/* ==================== 奖金分配 ==================== */
.prize-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.prize-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.prize-name {
  font-size: 0.85rem;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.prize-percent {
  font-size: 0.9rem;
  font-weight: 700;
  color: #FFD700;
}

.prize-detail {
  font-size: 0.7rem;
  color: #666;
}

/* ==================== 资金分配条 ==================== */
.fund-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.fund-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.fund-label {
  width: 50px;
  font-size: 0.75rem;
  color: #A0A0A0;
}

.fund-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.fund-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.fund-percent {
  width: 40px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
}

/* ==================== 响应式断点 ==================== */

/* 平板 - 768px */
@media (max-width: 768px) {
  .page-container {
    padding: 0.75rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .card-grid-2,
  .card-grid-3,
  .card-grid-4 {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-card {
    padding: 0.75rem;
    border-radius: 12px;
  }
  
  .countdown-value {
    font-size: 1.25rem;
  }
  
  .prize-row {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .prize-name {
    width: 100%;
  }
}

/* 手机 - 480px */
@media (max-width: 480px) {
  .page-container {
    padding: 0.5rem;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .page-subtitle {
    font-size: 0.8rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-value {
    font-size: 1rem;
  }
  
  .btn-block {
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
  }
  
  .quick-amount-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }
  
  .countdown-value {
    font-size: 1.1rem;
  }
  
  .pool-value {
    font-size: 1rem;
  }
  
  .info-row {
    padding: 0.4rem 0;
  }
  
  .info-label,
  .info-value {
    font-size: 0.75rem;
  }
}

/* 超小手机 - 320px */
@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-amount-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .page-title {
    font-size: 1.1rem;
  }
}

/* 横屏适配 */
@media (max-height: 500px) and (orientation: landscape) {
  .page-container {
    padding: 0.5rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .card-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

/* 安全区域 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .page-container {
    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  }
}
