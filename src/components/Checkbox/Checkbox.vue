<template>
  <ElCheckbox
    ref="componentRef"
    v-bind="elCheckboxMerged"
    class="EaconComponents EaconComponentsCheckbox"
  >
    <slot v-if="$slots.default" />
    <span v-else class="EaconComponentsCheckbox-emptyDefault" aria-hidden="true" />
    <template v-for="name in namedSlotNames" :key="name" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </ElCheckbox>
</template>

<script setup lang="ts">
import { computed, mergeProps, useAttrs, useSlots, useTemplateRef } from "vue";
import { ElCheckbox } from "element-plus";

import type { CheckboxProps } from "element-plus";

export type IProps = Partial<CheckboxProps>;
const props = defineProps<IProps>();
const attrs = useAttrs();
const slots = useSlots();

/** 表单项可能把 label={false} 透传到 attrs；无默认插槽时 ElCheckbox 会把 label 渲染成字面量 "false" */
const elCheckboxMerged = computed(() => {
  const merged = mergeProps(attrs, props) as Record<string, unknown>;
  if (typeof merged.label === "boolean") {
    const { label: _omit, ...rest } = merged;
    return rest;
  }
  return merged;
});

const namedSlotNames = computed(() => Object.keys(slots).filter((n) => n !== "default"));

const component = useTemplateRef("componentRef");

defineExpose({
  component,
});
</script>

<style lang="scss" scoped>
.EaconComponentsCheckbox-emptyDefault {
  display: none;
}

.EaconComponentsCheckbox {
  --el-disabled-border-color: var(--ea-text4);
  --el-disabled-text-color: var(--ea-text1);
  --el-checkbox-checked-bg-color: var(--ea-checkbox-selected-bg);
  &.is-disabled {
    &:deep(.is-indeterminate) {
      .el-checkbox__inner {
        border-color: transparent !important;
      }
    }
    &:deep(.el-checkbox__inner) {
      opacity: var(--ea-disabled-opacity);
      border-color: var(--el-disabled-border-color) !important;
    }
  }
  &.is-checked {
    &:deep() {
      .el-checkbox__input {
        .el-checkbox__inner {
          background: var(--el-checkbox-checked-bg-color);
          border-color: var(--ea-checkbox-selected-bdc);
        }
      }
    }
  }
  &:deep() {
    .el-checkbox__input {
      width: 16px;
      height: 16px;
      &.is-indeterminate {
        .el-checkbox__inner {
          border-color: var(--ea-checkbox-selected-bdc);
          background: var(--el-checkbox-checked-bg-color);
          &:before {
            background-color: var(--ea-fill7);
            height: 4px;
            top: 4px;
          }
        }
      }

      .el-checkbox__inner {
        border-color: var(--ea-checkbox-bdc);
        &:after {
          border-color: var(--ea-fill7);
          border-width: 2px;
        }
        &:hover {
          border-color: var(--ea-primary);
        }
      }
    }
    .el-checkbox__label {
      padding-left: 12px;
      color: var(--ea-text1);
    }
  }
}
</style>
