# agent.md - 智能体聊天窗口 MVP 需求计划

## Summary

- 目标是在 `imds-AI` 中新增类似豆包的全局悬浮聊天窗，首个验收场景放在设备管理页。
- 用户在 `/device/manage` 提问“设备编号DEV-1002的vin是多少？”，Agent 通过 `agent-center-AI` 调用 `device-center-AI` 查询设备数据，并返回确定性答案。
- 本文件作为后续代码实现和验收的需求依据。

## Key Changes

- 前端采用全局浮窗方案：在登录后的主布局中挂载聊天入口，默认折叠为悬浮按钮，展开后展示消息流、输入框、发送状态和最近回复；设备管理页作为首期验收页面。
- 复用现有 Agent 能力：继续使用已有 `/agent-api/api/agent/sessions`、消息发送、历史消息、工具日志接口；不新增前端依赖，不改变现有 Agent 工作台页面。
- 后端采用规则工具优先：不接外部大模型，`agent-center-AI` 从用户问题中识别 `DEV-1002` 这类设备编号，并识别 `vin/VIN/车架号` 查询意图。
- `queryDevices` 工具调用 `device-center-AI /api/devices` 时带上 `deviceCode=DEV-1002`，再从返回数据中精确匹配 `deviceCode`，读取 `vin`。
- 在 `device-center-AI` 开发/测试种子数据中加入设备 `DEV-1002`，VIN 固定为 `LVCB2N2E6PA100002`，保证验收可复现。

## Interfaces

- 保持现有前端发送消息接口不变：`POST /agent-api/api/agent/sessions/{id}/messages`，请求体仍为 `{ "content": string }`。
- 保持现有设备查询接口不变：`GET /api/devices?currentPage=1&pageSize=5&deviceCode=DEV-1002`。
- 工具日志 `responsePayload` 继续保留 `summary`、`source`、`recordsTotal`、`data`；针对 VIN 查询额外包含 `answer`、`matchedDeviceCode`、`matchedVin`，便于前端结构化展示。
- 首期标准回复文案：`设备DEV-1002的vin是LVCB2N2E6PA100002。`

## Edge Cases

- 查不到精确设备编号：回复 `未查询到设备编号 DEV-1002 对应的设备，无法确认 VIN。`
- 设备存在但 VIN 为空：回复 `设备编号 DEV-1002 当前未维护 VIN。`
- 设备中心调用失败：回复 `设备中心暂不可用，无法查询 DEV-1002 的 VIN。`
- 用户只说“设备编号DEV-1002是多少”但未明确 VIN：回复设备摘要，并包含设备编号、设备类型、所属组织、VIN、设备型号。

## Test Plan

- 后端测试：验证问题“设备编号DEV-1002的vin是多少？”会命中 `queryDevices`，请求参数包含 `deviceCode=DEV-1002`，助手消息返回固定 VIN 文案。
- 设备中心测试：验证种子数据存在，`GET /api/devices?deviceCode=DEV-1002` 返回 VIN `LVCB2N2E6PA100002`。
- 前端构建：在 `imds-AI` 执行 `pnpm build`，确保全局聊天窗引入后类型和构建通过。
- 手工验收：登录后进入设备管理页，打开悬浮聊天窗，输入示例问题，看到准确 VIN 回复，并能在工具日志中看到 `queryDevices` 成功记录。

## Assumptions

- 首期只做查询，不做新增、修改、删除等写操作。
- 首期不接真实 LLM，后续可把规则型回答替换为模型编排，但设备 VIN 查询仍保留确定性工具兜底。
- 执行时只做与本 MVP 相关的前端、`agent-center-AI`、`device-center-AI` 小范围改动，保留当前工作区已有未提交改动。
