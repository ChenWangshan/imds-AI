<template>
    <ElSelectV2
        v-model="value"
        ref="componentRef"
        class="EaconComponents EaconComponentsSelectV2"
        v-bind="mergeProps($attrs, props)"
        :collapse-tags="collapseTags"
        :options="renderOptions"
        :filter-method="filterMethod"
        popper-class="EaconComponentsSelectPopperV2"
        @change="handleChange"
        @visible-change="handleVisibleChange"
    >
        <template v-for="(_, name) in $slots" #[name]="sc">
            <slot :name v-bind="sc ?? {}"></slot>
        </template>

        <template v-if="!$slots.default" #default="{ item, index }">
            <div
                v-if="item[valueField] === selectAllValue"
                class="selectAllOption"
                :class="{
                    'is-selected': isSelectAll,
                    'is-indeterminate': isIndeterminate,
                }"
                @click.stop.prevent="selectAll"
            >
                <Checkbox
                    :model-value="isSelectAll"
                    :indeterminate="isIndeterminate"
                ></Checkbox>
                全选 ({{ filterValue.length }} / {{ filterList.length }})
            </div>
            <div v-else class="EaconComponentsSelectOption">
                <slot name="option" :item :idx="index" :filterValue>
                    <Checkbox
                        v-if="props.multiple"
                        :model-value="filterValue.includes(item[valueField])"
                    ></Checkbox>
                    <div class="EaconComponentsSelectOptionLabel" v-EaTooltip.overflow="item[labelField]">
                        {{ item[labelField] }}
                    </div>
                </slot>
            </div>
        </template>

        <template v-if="!$slots.empty && !filterList.length" #empty>
            <div class="EaconComponentsSelectEmpty">
                无匹配数据
            </div>
        </template>
    </ElSelectV2>
</template>

<script setup lang="ts">
import { mergeProps, useTemplateRef, nextTick, computed, ref } from "vue";
import { ElSelectV2 } from "element-plus";
import Checkbox from "../Checkbox/Checkbox.vue";

interface IBaseOption {
    [key: string]: any;
}
interface IProps {
    [key: string]: any;
    labelField?: string;
    valueField?: string;
    disabledField?: string;
    showSelectAll?: boolean;
    options: IBaseOption[];
    multiple?: boolean;
    collapseTags?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
    showSelectAll: true,
    filterable: true,
    clearable: true,
    validateEvent: true,
    persistent: true,
    collapseTags: true,
    disabledField: "disabled",
});

interface IEmits {
    change: [res: string[] | string];
    selectAll: [res: string[]];
}
const emit = defineEmits<IEmits>();

const labelField = computed(() => props.labelField ?? "label");
const valueField = computed(() => props.valueField ?? "value");
const selectAllValue = "__EA_SELECT_ALL__";
const collapseTags = computed(() => props.collapseTags);

const options = computed(() => props.options);
const value = defineModel<string[] | string>("modelValue", { default: [] });

const query = ref("");
const filterMethod = (e: string) => {
    query.value = e;
};

const filterList = computed(() => {
    if (!query.value) return options.value;
    return options.value.filter(
        (item) => item?.[labelField.value]?.indexOf?.(query.value) !== -1,
    );
});

const filterListMap = computed(() => {
    return filterList.value.reduce((list, item) => {
        const key = item[valueField.value];
        if (list[key]) {
            console.warn("下拉框包含重复项", props.options, item, valueField.value);
        }
        list[key] = item;
        return list;
    }, {} as Record<string, IBaseOption>);
});

const filterValue = computed(() => {
    if (!query.value || typeof value.value === "string") return value.value;
    return value.value.filter((item) => filterListMap.value[item]);
});

const isSelectAll = computed(() =>
    Boolean(
        Array.isArray(filterValue.value) &&
            filterValue.value.length &&
            filterValue.value.length >= filterList.value.length,
    ),
);
const isIndeterminate = computed(() =>
    Boolean(
        Array.isArray(filterValue.value) &&
            filterValue.value.length &&
            filterValue.value.length < filterList.value.length,
    ),
);

const renderOptions = computed(() => {
    const lf = labelField.value;
    const vf = valueField.value;
    const source = filterList.value.map((item) => ({
        ...item,
        label: item[lf],
        value: item[vf],
        disabled: Boolean(item[props.disabledField]),
    }));

    if (!props.multiple || !props.showSelectAll || !source.length) return source;
    return [
        {
            label: "全选",
            value: selectAllValue,
            [lf]: "全选",
            [vf]: selectAllValue,
            [props.disabledField]: false,
        },
        ...source,
    ];
});

const selectAll = () => {
    if (!Array.isArray(value.value)) return;
    const target = new Set(value.value);
    const vf = valueField.value;
    if (!isSelectAll.value) {
        filterList.value.forEach((item) => target.add(item[vf]));
    } else {
        filterList.value.forEach((item) => target.delete(item[vf]));
    }
    value.value = [...target];
    emit("change", [...target]);
    emit("selectAll", [...target]);
};

const handleChange = (nextValue: string[] | string) => {
    if (Array.isArray(nextValue) && nextValue.includes(selectAllValue)) {
        value.value = nextValue.filter((item) => item !== selectAllValue);
        selectAll();
        return;
    }
    emit("change", nextValue);
};

const component = useTemplateRef("componentRef");
const handleVisibleChange = (visible: boolean) =>
    nextTick(() => !visible && (document.activeElement as HTMLInputElement)?.blur?.());

defineExpose({
    component,
    filterValue,
});
</script>

<style lang="scss">
.is-error {
    .EaconComponentsSelect {
        .el-select__wrapper {
        border-image: none !important;
        border-color: transparent !important;
        }
    }
}
.EaconComponentsSelectPopperV2 {
    .el-select-dropdown {
        .el-select-dropdown__list {
            margin: 0 12px;

            .el-select-dropdown__item,
            .el-select-dropdown__option-item {
                width: calc(100% - 24px) !important;
                height: max-content;
                min-height: 34px;
                transform: translateZ(0);
                padding: 0 20px;

                &+.el-select-dropdown__item,
                &+.el-select-dropdown__option-item {
                    margin-top: 2px;
                }

                .EaconComponentsCheckbox {
                    height: max-content;
                }

                &:after {
                    display: none;
                }

                &.is-hovering {
                    background: none;
                }

                &:hover {
                    background: var(--ea-hover-bg);
                }

                &.is-selected {
                    color: var(--ea-tree-select-c);
                    background: var(--ea-select-bg);
                }
            }
        }

        &.is-multiple {
            .el-select-dropdown__list {
                .el-select-dropdown__item.is-selected,
                .el-select-dropdown__option-item.is-selected {
                    color: var(--ea-select-c);
                    background: none;

                    &:hover {
                        background: var(--ea-hover-bg);
                    }
                }
            }
        }
    }
    .el-select-dropdown__item:has(.selectAllOption) {
        &:hover {
            background: none !important;
        }
        .selectAllOption {
            display: flex;
            align-items: center;
            gap: 8px;
            background: none !important;
            color: var(--ea-text1) !important;
            font-weight: normal;
            height: max-content;
            min-height: 34px;
            line-height: 1;
            .EaconComponentsCheckbox {
                margin-top: 2px;
                pointer-events: none;
            }
        }
    }
    .EaconComponentsSelectOption {
        display: flex;
        gap: 8px;
        align-items: center;
        height: max-content;
        min-height: 34px;
    }

    .EaconComponentsSelectOptionLabel {
        width: 10px;
        flex: 1 1 auto;
        word-break: break-all;
        white-space: pre-wrap;
        line-height: 1.2;
    }

    .EaconComponentsSelectEmpty {
        color: var(--el-text-color-secondary);
        font-size: var(--el-select-font-size);
        padding: 4px 0;
        text-align: center;
    }
}
</style>

<style lang="scss" scoped>
.EaconComponentsSelectV2 {
    &:deep() {
        .el-select__wrapper {
            background: var(--ea-input-bg);
            box-shadow: none;
            border: 1px solid var(--ea-input-border-color);
            border-radius: 2px;

            &:hover {
                box-shadow: none;
                border-color: var(--ea-input-hover-border-color);
            }

            &.is-focused {
                border-image: var(--ea-primary-gradient) 1 1;
                background: var(--ea-input-focus-bg);

                .el-select__suffix {
                    .el-select__caret {
                        &.is-reverse {
                            color: var(--ea-primary);
                        }
                    }
                }
            }

            &.is-disabled {
                opacity: var(--ea-disabled-opacity);
                pointer-events: none;
            }

            .el-select__selection {
                flex-wrap: nowrap;
                display: flex;

                .el-select__selected-item {
                    color: var(--ea-text1);

                    .el-tag {
                        background: none;
                        color: var(--ea-text1);
                        font-size: 14px;

                        .el-tag__close {
                            background: none;
                            font-size: 14px;

                            &:hover {
                                color: var(--ea-primary);
                            }
                        }
                    }

                    &+.el-select__selected-item {
                        .el-tag {
                            position: relative;

                            &:after {
                                position: absolute;
                                top: 50%;
                                left: -3px;
                                transform: translateY(-50%);
                                content: "";
                                width: 1px;
                                height: 14px;
                                background: var(--ea-input-border-color);
                            }
                        }
                    }
                }

                .is-transparent {
                    color: var(--el-text-color-placeholder);
                }

                .el-select__input-wrapper {
                    width: 1%;
                    flex: 1 1 auto;
                    overflow: hidden;

                    .el-select__input {
                        width: 100%;
                    }
                }
            }

            .el-select__suffix {
                .el-select__clear {
                    &:hover {
                        color: var(--ea-primary);
                    }
                }
            }
        }

        .el-select__popper {
            --ea-scrollbar-offset-x: -2px;
        }

        .EaconComponentsSelectPopper {
            width: 100%;
        }
    }
}
</style>
