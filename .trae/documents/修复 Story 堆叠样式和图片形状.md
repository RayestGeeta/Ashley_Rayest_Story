# 修复 Story 堆叠样式和图片裁剪问题

用户反馈当前的实现与描述不符，主要问题集中在：
1.  **图片形状问题**：虽然我在 CSS 中设置了 `54px` 正圆，但用户截图显示图片依然是**扁椭圆**的。这很可能是 Leaflet `divIcon` 的 `iconSize` 设置与 CSS 冲突，或者图片的父容器被 Leaflet 的某些样式拉伸了。
2.  **堆叠效果问题**：用户截图显示两个 Story 是上下排列（像葫芦一样），而不是我描述的“像扑克牌一样前后堆叠”。这意味着 CSS 中的 `position: absolute` 可能没有生效，或者 `.story-ring` 没有正确地相对于 `.story-ring-container` 定位。

为了解决这些问题，我将执行以下计划：

1.  **彻底检查并修复 CSS 布局**：
    *   确认 `.story-ring-container` 的尺寸和定位上下文。
    *   确保 `.story-ring` 在堆叠模式下绝对定位 (`position: absolute`) 生效。
    *   检查是否有 Flexbox 属性干扰了绝对定位（比如 `display: flex` 在 container 上可能强制子元素排列）。
2.  **修正 Leaflet `divIcon` 配置**：
    *   调整 `iconSize` 和 `iconAnchor`，确保容器尺寸与 CSS 一致。
    *   检查生成的 HTML 结构，确保没有多余的 wrapper 干扰布局。
3.  **强制图片正圆**：
    *   使用 `aspect-ratio: 1/1` 强制图片比例。
    *   检查是否有全局样式覆盖了 `border-radius`。

**实施步骤：**

1.  **修改 `src/App.css`**：
    *   移除 `.story-ring-container` 上的 `display: flex`（针对 `.stacked` 状态），因为这会干扰 absolute positioning。
    *   加强 CSS 选择器权重，确保样式不被 Leaflet 默认样式覆盖。
    *   添加调试边框（临时）或使用更激进的 `!important` 来强制样式生效，确保布局正确。
2.  **验证**：
    *   通过预览确认图片是否变回正圆。
    *   确认堆叠是否变成了“前后”而不是“上下”。

**核心原因推测**：
我在 CSS 中保留了 `.story-ring-container { display: flex; ... }`。
对于非 stacked 状态，这是对的（居中单个 ring）。
对于 **stacked** 状态，如果保留 `display: flex`，所有的 `.story-ring` (即使设置了 `position: absolute`) 可能会表现异常，或者更可能的是：我的 CSS 选择器优先级不够高，或者某些 flex 属性（如 `gap` 或 `justify-content`）导致了布局偏移。
更重要的是，用户截图中图片被压扁了，这说明容器高度不够，或者宽度被拉伸。Leaflet 的 `divIcon` 默认是一个 `div`，如果我不显式设置这个 `div` 的样式，它可能只是包裹内容。

我将专注于 CSS 的修复。