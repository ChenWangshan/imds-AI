# 智慧矿山综管平台 Agent 接入实施步骤

## 1. 目标定义

在当前系统中新增一个 `Agent` 能力模块，让平台具备以下能力：

- 面向业务人员提供自然语言问答与指令执行入口
- 能读取当前系统中的业务数据，如配矿计划、设备信息、地图监控状态
- 能根据用户问题调用后端接口、整理结果并返回可读结论
- 能支持后续扩展为多 Agent 协同，如调度 Agent、生产 Agent、设备 Agent

建议先以“单 Agent 问答助手”落地，跑通基础能力后，再逐步扩展成多 Agent 架构。

---

## 2. 前端实施步骤

### 2.1 新增 Agent 业务入口

建议在左侧菜单新增一级或二级菜单，例如：

- 智能助手
- Agent 工作台
- 调度助手

建议新增页面：

- `src/views/agent/index.vue`
- 路由建议：`/agent/workbench`

页面建议包含：

- 会话区：展示用户提问与 Agent 回复
- 输入区：输入自然语言问题或业务指令
- 快捷指令区：例如“查询今日配矿计划”“统计运输设备在线数量”
- 上下文区：展示 Agent 当前使用的数据来源、执行状态、调用结果

### 2.2 设计前端交互结构

建议把 Agent 页面拆成以下区域：

1. 会话消息流
2. 输入面板
3. 推荐问题面板
4. 工具调用日志面板
5. 结果结构化展示面板

推荐交互流程：

1. 用户输入问题
2. 前端调用 Agent 接口
3. 展示“思考中 / 调用中”状态
4. 返回文本答案
5. 若包含结构化结果，再以表格、卡片、状态标签方式展示

### 2.3 封装前端 API

建议新增：

- `src/api/agent.ts`

首期建议封装以下接口：

- `createAgentSession`：创建会话
- `sendAgentMessage`：发送问题
- `getAgentSessionDetail`：获取会话详情
- `getAgentMessageList`：获取消息列表
- `getAgentToolLogs`：获取工具调用日志

### 2.4 新增前端状态管理

建议新增 store：

- `src/stores/modules/agent.ts`

建议存储内容：

- 当前会话 ID
- 会话列表
- 消息列表
- 当前输入内容
- Agent 执行状态
- 工具调用日志
- 最近问题推荐

### 2.5 与现有业务模块打通

建议先打通以下业务模块数据：

- 配矿计划
- 设备管理
- 设备型号
- 地图监控
- 用户管理

前端层面要支持 Agent 回答后跳转到对应业务页，例如：

- 从 Agent 回复中跳转到 `/production/blending-plan`
- 跳转到 `/device/manage`
- 跳转到 `/dispatch/map-monitor`

---

## 3. 后端实施步骤

### 3.1 新增 Agent 服务模块

如果继续沿用当前前后端分中心方式，建议单独新增一个 Agent 服务，例如：

- `agent-center-AI`

如果先追求快速上线，也可以先挂在现有某个中心服务内，但从长期维护看，更推荐独立服务。

### 3.2 设计 Agent 核心接口

建议后端提供以下接口：

- `POST /api/agent/sessions`
  - 创建会话
- `GET /api/agent/sessions`
  - 获取会话列表
- `GET /api/agent/sessions/{id}`
  - 获取会话详情
- `POST /api/agent/sessions/{id}/messages`
  - 发送消息并触发 Agent 执行
- `GET /api/agent/sessions/{id}/messages`
  - 获取消息记录
- `GET /api/agent/sessions/{id}/tool-logs`
  - 获取工具调用日志

### 3.3 设计数据库表

建议至少新增以下表：

1. `agent_sessions`
   - `id`
   - `session_code`
   - `title`
   - `user_id`
   - `status`
   - `created_at`
   - `updated_at`

2. `agent_messages`
   - `id`
   - `session_id`
   - `role`，如 `user / assistant / tool`
   - `content`
   - `message_type`
   - `created_at`

3. `agent_tool_logs`
   - `id`
   - `session_id`
   - `message_id`
   - `tool_name`
   - `request_payload`
   - `response_payload`
   - `status`
   - `created_at`

4. `agent_prompt_templates`
   - `id`
   - `agent_code`
   - `prompt_name`
   - `prompt_content`
   - `enabled`

### 3.4 封装 Agent 编排层

建议后端不要把逻辑直接写在 controller 中，而是拆成：

- `AgentSessionService`：管理会话
- `AgentMessageService`：管理消息
- `AgentOrchestratorService`：负责真正执行 Agent 逻辑
- `AgentToolService`：负责工具调用
- `PromptTemplateService`：管理系统提示词

推荐执行流程：

1. 接收用户问题
2. 加载系统提示词与业务上下文
3. 判断需要调用哪些内部工具
4. 执行工具调用
5. 汇总工具结果
6. 生成最终回复
7. 保存会话和日志

---

## 4. Agent 工具设计步骤

### 4.1 明确首批工具

建议首批先做“查询类工具”，不要一上来做高风险写操作。

首批工具建议：

- `queryBlendingPlans`
  - 查询配矿计划
- `queryDevices`
  - 查询设备信息
- `queryDeviceModels`
  - 查询设备型号
- `queryMapMonitorStatus`
  - 查询地图监控设备态势
- `queryUsers`
  - 查询用户信息

### 4.2 规范工具输入输出

每个工具都建议统一定义：

- 工具名
- 描述
- 入参 schema
- 出参 schema
- 错误码

例如：

- 输入：日期、班次、组织
- 输出：计划列表、总吨位、状态统计

### 4.3 加入权限控制

Agent 不应绕过平台权限。

建议每次调用工具时校验：

- 当前登录用户是谁
- 用户拥有哪些菜单权限
- 用户能访问哪些组织数据
- 哪些指令允许执行，哪些只允许查询

---

## 5. 模型接入步骤

### 5.1 选择模型接入方式

建议先明确两种模式之一：

- 模式 A：接入外部大模型 API
- 模式 B：接入企业内部部署模型

无论采用哪种方式，都建议在后端统一封装一层 `LLMClient`，不要在业务代码里直接散落模型调用。

### 5.2 设计提示词体系

建议拆成以下几层：

- 系统提示词
- 角色提示词
- 工具调用提示词
- 回复格式提示词

例如当前系统可先定义：

- 智慧矿山综合问答 Agent
- 生产管理 Agent
- 设备管理 Agent
- 智能调度 Agent

### 5.3 控制输出格式

建议要求模型输出结构化内容，例如：

- `summary`
- `answer`
- `actions`
- `toolCalls`
- `cards`

这样前端更容易渲染，不会只剩一段纯文本。

---

## 6. 业务落地顺序建议

建议按以下顺序推进：

### 第一阶段：单 Agent 问答 MVP

实现内容：

- Agent 页面
- 基础会话能力
- 配矿计划查询工具
- 设备查询工具
- 文本问答返回

验收标准：

- 能创建会话
- 能提问并返回回答
- 能查询真实业务数据
- 能在页面里展示历史消息

### 第二阶段：结构化结果展示

实现内容：

- 表格卡片渲染
- 工具日志展示
- 推荐问题
- 跳转业务模块

验收标准：

- Agent 回复可带结构化卡片
- 能跳转到对应业务页面
- 能追踪工具调用过程

### 第三阶段：多 Agent 分工

实现内容：

- 生产 Agent
- 设备 Agent
- 调度 Agent
- Agent 路由与协同

验收标准：

- 不同问题能分发到不同 Agent
- 每个 Agent 使用不同提示词和工具集合

### 第四阶段：写操作与闭环

实现内容：

- 通过 Agent 创建配矿计划
- 通过 Agent 修改设备信息
- 指令确认机制
- 操作审计

验收标准：

- 高风险操作必须二次确认
- 所有 Agent 写操作可审计、可追踪

---

## 7. 当前项目建议优先改造点

结合当前项目结构，建议优先改这些位置：

1. `src/router/index.ts`
   - 新增 Agent 路由与菜单

2. `src/api`
   - 新增 `agent.ts`

3. `src/stores/modules`
   - 新增 `agent.ts`

4. `src/views`
   - 新增 `agent/index.vue`
   - 新增消息列表、输入框、结果卡片等子组件

5. `vite.config.ts`
   - 新增 Agent 后端代理，例如 `/agent-api`

6. 后端服务
   - 新增 Agent controller、service、model、schema

---

## 8. 风险与注意事项

### 8.1 不要直接让 Agent 执行高风险写操作

例如：

- 删除配矿计划
- 删除设备
- 修改关键调度参数

这些动作必须增加：

- 权限校验
- 二次确认
- 审计日志

### 8.2 不要让 Agent 直接拼 SQL

正确方式应该是：

- Agent 只决定调用哪个工具
- 工具内部走受控 service / repository
- 所有查询条件都做白名单约束

### 8.3 注意上下文长度与性能

如果后面会话很多，建议：

- 只加载最近 N 条消息
- 摘要压缩历史上下文
- 工具结果只回传必要字段

### 8.4 注意结果可解释性

建议在页面中展示：

- 本次是否调用了工具
- 调用了哪些工具
- 数据来源是什么
- 回答生成时间

---

## 9. 推荐最终产出物

建议最终形成以下交付物：

- Agent 前端页面
- Agent 后端服务
- Agent 会话表与消息表
- 工具调用日志表
- 至少 3 个业务查询工具
- 一套系统提示词模板
- 一份操作审计方案
- 一份联调与验收文档

---

## 10. 推荐下一步

如果现在就要开始做，建议按下面顺序直接开工：

1. 新增 Agent 菜单和空白页面
2. 新增 `/agent-api` 代理
3. 定义 Agent 会话与消息接口
4. 先接通“配矿计划查询 Agent”
5. 完成聊天页面基础版
6. 再补设备查询和地图监控查询

这样能最快把 Agent 能力接入当前系统，并且控制改造风险。
