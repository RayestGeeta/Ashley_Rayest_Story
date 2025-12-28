# 全面排查与修复 Story 堆叠与变形问题

用户反馈问题依旧存在：
1.  **堆叠依然是上下排列**（像葫芦），而不是前后层叠。
2.  **图片依然是椭圆**，没有变成正圆。

这说明之前的 CSS 修改根本没有生效，或者被 Leaflet 的某些强样式覆盖了。我需要更深入地排查。

**根本原因假设：**

1.  **CSS 未生效或优先级不够**：Leaflet 的 `divIcon` 会生成一个 `div` wrapper，并且 Leaflet 会直接在元素上设置 `width` 和 `height` style，这可能会覆盖 CSS。
2.  **HTML 结构问题**：
    *   `InteractiveMap.jsx` 中 `createStoryIcon` 生成的 HTML 字符串可能包含影响布局的结构。
    *   `.story-ring-container` 本身是 `divIcon` 的内容，但 `divIcon` 本身也有尺寸。如果 `divIcon` 的尺寸设置不当，或者 CSS 中对 `divIcon` 的父级没有控制好，就会导致问题。
3.  **Flexbox 干扰**：`.story-ring-container` 依然保留了 `display: flex`（虽然我试图移除它），这会强制子元素（即使是 `absolute`）在某些浏览器行为下出现异常，或者更有可能的是，`.story-ring` 没有正确地相对于 container 定位。
4.  **Leaflet 的默认样式干扰**：Leaflet 给 marker pane 里的图片或 div 加了默认样式。

**排查与修复计划：**

1.  **彻底重构 CSS**：
    *   **移除 Flexbox**：对于 `.story-ring-container`，完全移除 `display: flex`，改用纯粹的 `block` 或 `relative` 布局。
    *   **硬编码尺寸**：在 CSS 中强制所有相关元素（container, ring, img）的 `width` 和 `height`，并使用 `!important`。
    *   **重置继承样式**：确保 `img` 不会继承 Leaflet 的 `max-width: 100%` 等可能导致变形的样式。

2.  **调整 `InteractiveMap.jsx`**：
    *   检查 `createStoryIcon` 的 HTML 结构。
    *   **关键点**：确保 `divIcon` 的 `className` 设置正确，并且 HTML 字符串没有多余的空格或换行导致布局错位。
    *   **Leaflet Icon Size**：确保 JS 中的 `iconSize` 与 CSS 中的尺寸完全匹配。

3.  **验证步骤**：
    *   我将读取 `InteractiveMap.jsx` 确保 HTML 结构无误。
    *   我将读取 `App.css` 并进行**破坏性重写**（删除旧的干扰样式，只保留核心逻辑）。

**具体 CSS 修复逻辑**：
*   `.story-ring-container`: `display: block`, `position: relative`, `width: 60px`, `height: 60px`.
*   `.story-ring`: `position: absolute`, `top: 0`, `left: 0`, `width: 100%`, `height: 100%`. (通过 padding/margin 调整大小)
*   **堆叠逻辑**：所有 ring 默认叠在一起 (`top: 0, left: 0`)，只通过 `transform` 来做微小的位移。之前的 `margin-top` 等可能导致了垂直流布局。

**执行顺序**：
1.  读取 `InteractiveMap.jsx` 再次确认 HTML 生成逻辑。
2.  重写 `App.css`，特别是关于 `.story-ring-container` 和 `.story-ring` 的部分。