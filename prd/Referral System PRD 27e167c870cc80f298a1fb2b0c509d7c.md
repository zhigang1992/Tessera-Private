# Referral System PRD

# Background

Tessera将使用Referral系统来吸引新用户，为了减少开发，可以采用ReferralHero系统作为Referral系统的底层。关于Referral Hero的支持力度，我已经完成了初步的调研，大部分的功能都是支持的。

[Evaluation of ReferralHero for Tessera’s Referral System](https://www.notion.so/Evaluation-of-ReferralHero-for-Tessera-s-Referral-System-27e167c870cc8133821cf502166c92dc?pvs=21)

# 📄 产品需求文档（PRD）

## 🎯 目标与概要

Tessera 计划构建两套独立的激励系统，通过 ReferralHero 平台实现透明、公平的奖励分配。这两套系统分别针对**推荐返佣**和**交易折扣**，各自具有独立的计分逻辑，并均可累积积分用于未来奖励。整体目标是在增加新用户与交易量的同时，建立持久的激励机制并提升社区活跃度。

两套系统简述如下：

- **系统一：费率返佣系统** — 利用多级邀请结构奖励推荐者，从被推荐用户产生的交易手续费中返还一定比例。该系统通过推荐积分分层，用户积累的推荐积分越高，返佣比例越高。
- **系统二：交易折扣系统** — 根据用户在平台上的交易量授予手续费折扣，交易量越大折扣越高。该系统按交易量分层，鼓励交易者贡献更多流动性。

两套系统都会发放积分以解锁未来奖励，如徽章、排行榜成就或其他福利[rocknblock.io](https://rocknblock.io/blog/onchain-referral-program-development-for-web3-projects#:~:text=,referrers%2C%20adding%20a%20competitive%20element)[rocknblock.io](https://rocknblock.io/blog/onchain-referral-program-development-for-web3-projects#:~:text=Why%20It%20Works%3A%20Gamification%20is,drive%20higher%20participation%20and%20retention)。通过 gamification 机制，可以提升用户参与度并促进社区互动[rocknblock.io](https://rocknblock.io/blog/onchain-referral-program-development-for-web3-projects#:~:text=,referrers%2C%20adding%20a%20competitive%20element)[rocknblock.io](https://rocknblock.io/blog/onchain-referral-program-development-for-web3-projects#:~:text=Why%20It%20Works%3A%20Gamification%20is,drive%20higher%20participation%20and%20retention)。

所有奖励将依据公开规则和数据自动发放，避免手动选取“顶级推荐人”。同时需要认识到顶级交易者与顶级推荐者往往是不同群体，因此交易折扣应以用户自身交易量为依据，不再依赖推荐积分。不得在宣传中承诺未来代币空投。

## ⚙️ 核心功能

### 账号注册与管理

为了提升用户体验并方便推荐活动的传播，本方案在**注册和账户管理**方面引入以下设计：

- **Solana 钱包登录与推荐码激活**：用户可以使用 Solana 钱包（如 Phantom、Backpack 等）直接登录平台。登录成功后，在“推荐”页面提供一个“激活推荐码”按钮，点击后系统自动为该地址生成一个默认推荐码，并对应一个推荐链接。用户可使用字母、数字或下划线来自定义推荐码的后缀，类似 GMX 的实践[docs.gmxsol.io](https://docs.gmxsol.io/about/referrals/#:~:text=,of%20letters%2C%20numbers%20and%20underscores)。系统限制每个地址只能生成一个唯一推荐码，并可绑定多个地址使用，但禁止自推或互推[docs.gmxsol.io](https://docs.gmxsol.io/about/referrals/#:~:text=,mutual%20referrals%20are%20not%20allowed)。
- **账户面板与邮箱绑定**：登录后用户将拥有一个账户面板，显示其推荐码、推荐积分、交易积分、返佣/折扣情况等。用户可在面板中绑定一个电子邮箱，绑定后即可使用邮箱登录并查看自己的推荐仪表盘，也可以通过邮箱接收返佣通知、积分更新等消息。邮箱绑定提供了比钱包更稳定的登录方式，便于用户在不同设备上访问和管理其账号。
- **多钱包聚合管理**：考虑到许多用户持有多个钱包地址，平台支持将多个不同的钱包绑定到同一账号（即同一邮箱）。这一功能可通过集成第三方多钱包管理工具实现，这类工具能够在一个统一账户下管理多个钱包，提供钱包切换检测和账户合并等能力[dynamic.xyz](https://www.dynamic.xyz/features/user-authentication#:~:text=Easily%20manage%20multiple%20wallets%20in,one%20unified%20account)。用户在绑定新钱包后，系统会将该钱包产生的推荐数据和积分合并到其主账号，使用户能够集中查看和管理全部推荐积分和返佣收益。

通过上述设计，注册与管理流程既便捷又灵活，兼顾去中心化身份（钱包）与传统认证方式（邮箱），并允许用户自由定制推荐码以提升传播效果，同时满足多钱包用户的管理需求。

### 系统划分概览

本方案包含两套独立的激励系统：

- **费率返佣系统**：以推荐积分和多级邀请结构为核心，为成功推荐者返还一定比例的交易手续费。
- **交易折扣系统**：基于用户个人交易量授予交易费折扣，与推荐积分无关，鼓励交易活跃度。

两套系统均通过 ReferralHero 记录、跟踪和发放奖励，允许自定义参数和时间窗口。

### 集成与定制

- 使用 **ReferralHero** 作为推荐平台，负责链接生成、推荐跟踪和奖励发放；
- 利用其 *奖励层*、*按时间重置计数*、*日期范围* 等功能，定期清零推荐计数并限制奖励有效期[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=Time)[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=Date%20Range)；
- 通过订阅者标签自动归类不同表现用户，实现动态分层。

### 系统与奖励类型

- **费率返佣系统**（系统一）
    
    通过推荐链接带来新用户的推荐者可从被推荐用户产生的交易手续费中获得返佣，返佣比例根据推荐积分层级而变化。
    
    同时，推荐者在完成推荐后将获得一定数量的“推荐积分”，用于未来奖励。例如，每成功邀请一人可获得固定积分，或按被推荐用户交易额累积积分。
    
- **交易折扣系统**（系统二）
    
    用户在平台上交易可根据个人交易量获得手续费折扣；折扣比例与用户当前交易量层级相关，与推荐积分无关。
    
    交易者的交易量同时转化为“交易积分”，这些积分用于积分排行榜和未来奖励发放，激励用户持续交易。
    

### 多级邀请结构（多层返佣）

- **第 1 层（L1）– 直接推荐**：使用你的推荐链接注册并交易的用户；
- **第 2 层（L2）– 间接推荐**：由 L1 推荐者推广而来的用户；
- **第 3 层（L3）– 继续推荐**：由 L2 推荐者推广而来的用户；
- 返佣比例示例（可调）：L1 级返佣 30%，L2 级返佣 3%，L3 级返佣 2%。系统可根据推荐者的表现和层级自动调整这些比例。

### 推荐积分分层（适用于费率返佣系统）

- **推荐积分分层**：在滚动时间窗（如 90 天）内，根据推荐者累积的“推荐积分”自动分层。高表现用户自动上升层级，普通用户保持在基础层。

- **动态阈值（积分）**：依据整个社区的推荐积分分布确定层级阈值（例如：积分排名前 10% 为第 3 层，接下来 30% 为第 2 层，其余为第 1 层）。该层级直接影响返佣比例。

### 交易量分层（适用于交易折扣系统）

- **基于交易量的分层**：系统将在滚动时间窗（如 90 天）内统计每位用户的个人交易量，并据此为交易费折扣划分层级。
- **折扣层级示例**：例如，个人交易量排名前 10% 为“高交易层”，前 10%-40% 为“中交易层”，其余为“低交易层”，分别对应约 10%、5%、2% 的折扣比率。具体阈值和比例可以根据运营策略调整，确保高交易量用户受益，而低交易量用户仍可享有基础优惠。

### 时间限制的活动窗口

- **滚动窗口与过期**：推荐积分仅在固定时间窗内有效，周期结束后清零[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=Time)；
- **单个推荐奖励上限**：对每个被推荐用户的返佣设置总额上限，类似 ReferralHero 支持的交易奖励封顶[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=1.%20Referral%20count,over%20a%20set%20time%20period)。

### 活动加成与促销

- **限时加成**：在特定活动期间（如新代币销售）可临时提高返佣和折扣比例，并通过日期范围设置自动开始和结束[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=Date%20Range)；
- **营销推广**：在活动窗口内积极宣传，提高参与度，并通过社交媒体与推荐者合作传播。

### 资格与阈值

- **最低交易额要求**：只有当被推荐用户交易额达到最低门槛（如 50 美元）时，推荐者才获得返佣[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=Conversion%20Value)；
- **反欺诈措施**：启用邮箱/手机号/钱包地址验证和 ReferralHero 内置的防作弊功能。

### 用户体验

- **数据透明**：为每位用户提供仪表盘，展示其推荐层级、交易量层级、返佣比率、交易折扣比率、被推荐用户表现及历史奖励；

- **明确规则**：清楚公示推荐积分规则、交易量分层规则、重置周期、返佣比例、折扣比例和活动期间的临时调整；

- **严禁误导**：不可在任何推广材料中承诺未来治理代币空投。

## 📜 返佣系统

### 返佣系统规则

### 推荐积分与层级

1. **积分来源**：在滚动时间窗（如 90 天）内，推荐者通过以下方式累积“推荐积分”：
    - 每成功邀请一位用户注册并完成指定交易，获得固定积分；
    - 被推荐用户在有效期内产生的交易手续费按比例累加积分。
2. **等级计算**：周期结束时统计有效推荐积分，按排名自动划分层级。推荐积分分布前 10% 为第 3 层，接下来 30% 为第 2 层，其余为第 1 层。

### 返佣设计

返佣比例与推荐积分层级直接挂钩，具体比例见下文《返佣系统设计》。

### 返佣系统设计

1. **推荐返佣设计（收益 1）**：
    - **第 3 层（高表现）**：
        - L1：20% 返佣；L2：3%；L3：2%。
    - **第 2 层（中等表现）**：
        - L1：10% 返佣；L2：2%；L3：1% L3。
    - **第 1 层（普通用户）**：
        - L1：5% 返佣；不参与 L2/L3。
    - 上述返佣比例为示例，可根据实际运营情况调整，但必须统一规则，并基于推荐积分自动获得，不需要手动批准。
2. **有效期与过期**：返佣只能在推荐计数有效期内产生；对每个被推荐用户的返佣设定封顶金额[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=1.%20Referral%20count,over%20a%20set%20time%20period)。交易折扣同样按周期更新，若用户在新周期内交易量下降，其折扣比例将随之调整。

## 😀交易折扣系统规则

### 交易积分与层级

1. **积分来源**：在滚动时间窗（如 90 天）内，用户的个人交易量按比例转化为“交易积分”。例如，每交易 1 美元可获得 1 积分（实际比例可根据运营需求调整）。
2. **折扣层级**：周期结束时根据交易积分排名或交易量阈值划分层级：
    - **高交易层**：个人交易量在滚动窗口内排名前 10%（或超过某一固定阈值），可享受约 10% 的交易费折扣。
    - **中交易层**：个人交易量位于前 10%-40%（或介于高阈值和中阈值之间），可享受约 5% 的交易费折扣。
    - **低交易层**：其余活跃用户，可享受约 2% 的基础折扣。
    - 具体的交易量阈值和折扣比例可根据平台整体活跃度和市场情况调整，折扣层级与推荐积分层级独立计算。
3. **有效期与过期**：交易折扣按重置周期更新，若用户在新周期内交易量下降，其折扣比例将随之调整。

### 积分与未来奖励

积分系统贯穿两套激励体系。推荐积分和交易积分可独立或合并用于未来奖励，例如解锁徽章、进入排行榜或兑换其他福利。平台可公布积分排行榜以营造竞争氛围，并通过时间限制的挑战和里程碑奖励激励用户持续参与[rocknblock.io](https://rocknblock.io/blog/onchain-referral-program-development-for-web3-projects#:~:text=,referrers%2C%20adding%20a%20competitive%20element)。

应明确强调，积分仅用于未来福利和社区激励，不代表任何代币或股权，亦不应被视为未来代币空投的承诺。

### 活动加成

- 管理员可定义限时活动，在活动期间临时提高返佣和折扣比率；
- 使用 ReferralHero 的 *日期范围* 设置，在限定日期内自动启用和关闭[support.referralhero.com](https://support.referralhero.com/campaign-builder/rewards/reward-settings#:~:text=Date%20Range)。

### 公平与透明

- 所有用户均有同等机会进入高层级，系统通过数据驱动的模式自动分层，禁止手动选择推荐人；
- 明确发布所有规则和奖励数值，避免任何暗示或承诺未来代币空投。

## ⚙️ 10月19号之前要上的版本

10月19日的版本尚未开始正式的trading，所以我们需要上线
1.注册账户

2.生成customize referral code

3.完成Referral 账户绑定

4.用户查看自己的referral关系

以上四个功能

Referral 界面分成两个大板块

- Referral
- Leaderboard

### Referral板块

- 下设两个Tab
    - Trader Tab展示用户作为Trader时的状态
    - Affiliates Tab展示用户作为邀请人时的状态

### Trader Tab

![image.png](Referral%20System%20PRD%2027e167c870cc80f298a1fb2b0c509d7c/image.png)

- Trading Volume 展示用户的总交易量
- Active Referral Code 展示用户该钱包地址当前关联的邀请Code（即用户使用当前账户交易，他的积分会返给谁），Active Referral Code可以修改，修改后应立即生效
- Fee Rebate 展现这个账户通过trading discount所获取的交易费折扣金额（交易费折扣按月发放）
- Your Trading Points（按照实际收取的交易费，一交易费一分）
- Fee Discount （当前地址的交易费折扣比例）

### Affiliate Tab （我的邀请界面）

![image.png](Referral%20System%20PRD%2027e167c870cc80f298a1fb2b0c509d7c/image%201.png)

- Rebates (用户收到的所有Referral Code 加总的Rebates的总数）
- Referral Points（Referral积分，目前是1 Rebates= 1 Points）
- Email，用户可以连接一个Email 到他的钱包地址，便于以后管理
- 层级示意图（Trader Layers，代表他邀请的不同层的用户分别有多少，以及积分有多少）

**Code**

- Referral Code，点击复制按钮，帮用户复制完整的邀请连接到剪切板。点击X调起用户Twitter，帮用户编辑好推文发推
- Trader Referred，L1层级Refer了多少人（只统计L1）
- Active Layer（由于不是每个Referral Code都能享受3级返佣，所以要表达当前的状态）
- Total Rebates （当前Referral Code的Rebates总数）

### Leader Board

Leader Board是用户的积分排序榜，按照用户的 Referral Points排序

![image.png](Referral%20System%20PRD%2027e167c870cc80f298a1fb2b0c509d7c/image%202.png)