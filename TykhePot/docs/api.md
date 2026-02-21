# API 文档

## 合约接口

### 初始化
```typescript
initialize(params: InitializeParams)
```
初始化协议状态。

**参数:**
- `initialReserve`: 初始储备金额 (u64)
- `initialReferralPool`: 初始推广池金额 (u64)

### 参与小时池
```typescript
depositHourly(amount: u64)
```
参与小时奖池。

**参数:**
- `amount`: 投入金额 (最低 200 TPOT)

### 参与天池
```typescript
depositDaily(amount: u64, referrer: Option<Pubkey>)
```
参与每日奖池，可填写邀请人地址。

**参数:**
- `amount`: 投入金额 (最低 100 TPOT)
- `referrer`: 邀请人地址 (可选)

### 开奖
```typescript
drawHourly(randomness: [u8; 32])
drawDaily(randomness: [u8; 32])
```
执行开奖，需要 VRF 随机数。

### 领取奖金
```typescript
claimVested()
```
领取已解锁的奖金。

## 前端 SDK

### 初始化
```javascript
import TykhePotSDK from './utils/sdk';

const sdk = new TykhePotSDK(provider);
```

### 获取余额
```javascript
const balance = await sdk.getTokenBalance(publicKey);
```

### 参与抽奖
```javascript
// 小时池
await sdk.depositHourly(200000000000); // 200 TPOT

// 天池
await sdk.depositDaily(100000000000, referrerPubkey); // 100 TPOT
```

### 查询状态
```javascript
const state = await sdk.getProtocolState();
const userState = await sdk.getUserState(publicKey);
```

## 事件

### DepositEvent
用户参与奖池时触发。

### DrawEvent
开奖时触发。

### ClaimEvent
用户领取奖金时触发。

## 错误码

| 错误码 | 名称 | 说明 |
|--------|------|------|
| 6000 | BelowMinDeposit | 低于最低投入 |
| 6001 | PoolLocked | 奖池锁定中 |
| 6002 | DrawTooEarly | 开奖时间未到 |
| 6003 | NotEnoughParticipants | 参与人数不足 |
| 6004 | NoClaimableAmount | 无可领取金额 |
| 6005 | InvalidRandomness | 无效随机数 |
| 6006 | Unauthorized | 未授权 |
