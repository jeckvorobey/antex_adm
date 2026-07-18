import { config } from '@vue/test-utils';
import { defineComponent, h, reactive } from 'vue';
import { createPinia } from 'pinia';
import { vi } from 'vitest';

const notifyCreate = vi.fn();
const dialogCreate = vi.fn();

vi.mock('quasar', () => {
  const screen = reactive({
    xs: false,
    sm: false,
    md: true,
    lg: false,
    xl: false,
    lt: { sm: false, md: false, lg: true, xl: true },
    gt: { xs: true, sm: true, md: false, lg: false },
    name: 'md',
    width: 1024,
    height: 768,
  });

  const Quasar = {
    install() {
      return undefined;
    },
  };

  const Notify = {
    create: notifyCreate,
  };

  const Dialog = {
    create: dialogCreate,
  };

  const useQuasar = () => ({
    screen,
    notify: (...args: unknown[]) => Notify.create(...args),
    dialog: (...args: unknown[]) => Dialog.create(...args),
  });

  const copyToClipboard = vi.fn().mockResolvedValue(undefined);

  return { Quasar, Notify, Dialog, Screen: screen, useQuasar, copyToClipboard };
});

function slotChildren(slots: Record<string, (() => unknown) | undefined>, name = 'default') {
  return slots[name]?.() ?? [];
}

function wrapTag(tag: string, className: string) {
  return defineComponent({
    name: `Stub${className.replace(/[^a-zA-Z0-9]/g, '')}`,
    setup(_props, { slots, attrs }) {
      return () => h(tag, { ...attrs, class: className }, slotChildren(slots));
    },
  });
}

const QBtnStub = defineComponent({
  name: 'QBtnStub',
  props: {
    label: { type: String, default: '' },
    icon: { type: String, default: undefined },
    type: { type: String, default: 'button' },
    loading: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          class: 'q-btn',
          icon: props.icon,
          type: props.type,
          loading: props.loading ? 'true' : undefined,
          onClick: (event: MouseEvent) => emit('click', event),
        },
        [
          props.label ? h('span', { class: 'q-btn__label' }, props.label) : null,
          ...slotChildren(slots),
        ],
      );
  },
});

const QFormStub = defineComponent({
  name: 'QFormStub',
  emits: ['submit'],
  setup(_props, { emit, slots, attrs }) {
    return () =>
      h(
        'form',
        {
          ...attrs,
          class: 'q-form',
          onSubmit: (event: Event) => {
            event.preventDefault();
            emit('submit', event);
          },
        },
        slotChildren(slots),
      );
  },
});

const QInputStub = defineComponent({
  name: 'QInputStub',
  props: {
    modelValue: { type: [String, Number], default: '' },
    type: { type: String, default: 'text' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'clear'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h('label', { class: 'q-input' }, [
        props.label ? h('span', { class: 'q-field__label' }, props.label) : null,
        h('input', {
          ...attrs,
          type: props.type,
          value: String(props.modelValue ?? ''),
          placeholder: props.placeholder,
          onInput: (event: Event) => {
            const target = event.target as HTMLInputElement;
            const nextValue = props.type === 'number' ? Number(target.value || '0') : target.value;
            emit('update:modelValue', nextValue);
          },
        }),
        ...slotChildren(slots, 'prepend'),
        ...slotChildren(slots, 'append'),
      ]);
  },
});

const QSelectStub = defineComponent({
  name: 'QSelectStub',
  props: {
    modelValue: { type: [String, Number, Object, null], default: null },
    options: { type: Array, default: () => [] },
    optionValue: { type: String, default: 'value' },
    optionLabel: { type: [String, Function], default: 'label' },
    emitValue: { type: Boolean, default: false },
    mapOptions: { type: Boolean, default: false },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    useInput: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'filter', 'clear'],
  setup(props, { emit, slots, attrs }) {
    function getOptionValue(option: Record<string, unknown>) {
      const value = option[props.optionValue] ?? option.id ?? option.value;
      return typeof value === 'number' || typeof value === 'string' ? value : '';
    }

    function getOptionLabel(option: Record<string, unknown>) {
      if (typeof props.optionLabel === 'function') {
        return String(props.optionLabel(option));
      }
      const rawLabel = option[props.optionLabel];
      return String(rawLabel ?? '');
    }

    return () =>
      h('label', { class: 'q-select' }, [
        props.label ? h('span', { class: 'q-field__label' }, props.label) : null,
        props.useInput
          ? h('input', {
              class: 'q-select__input',
              placeholder: props.placeholder,
              onInput: (event: Event) => {
                const target = event.target as HTMLInputElement;
                emit(
                  'filter',
                  target.value,
                  (fn: () => void) => fn(),
                  () => undefined,
                );
              },
            })
          : null,
        h(
          'select',
          {
            ...attrs,
            value: String(props.modelValue ?? ''),
            onChange: (event: Event) => {
              const target = event.target as HTMLSelectElement;
              const selected = (props.options as Array<Record<string, unknown>>).find(
                (option) => String(getOptionValue(option)) === target.value,
              );
              if (props.emitValue) {
                const val = selected ? getOptionValue(selected) : target.value;
                emit('update:modelValue', typeof val === 'number' ? val : val);
              } else {
                emit('update:modelValue', selected ?? target.value);
              }
            },
          },
          (props.options as Array<Record<string, unknown>>).map((option) =>
            h(
              'option',
              {
                value: String(getOptionValue(option)),
              },
              getOptionLabel(option),
            ),
          ),
        ),
        h(
          'div',
          { class: 'q-select__options' },
          (props.options as Array<Record<string, unknown>>).flatMap(
            (option) =>
              slots.option?.({ opt: option, selected: false, toggleOption: () => undefined }) ?? [
                h('div', { class: 'q-select__option' }, getOptionLabel(option)),
              ],
          ),
        ),
        ...((props.options as Array<Record<string, unknown>>).length === 0
          ? slotChildren(slots, 'no-option')
          : []),
      ]);
  },
});

const QDateStub = defineComponent({
  name: 'QDateStub',
  props: {
    modelValue: { type: String, default: '' },
    mask: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        class: 'q-date',
        value: props.modelValue,
        mask: props.mask,
        onInput: (event: Event) => {
          const target = event.target as HTMLInputElement;
          emit('update:modelValue', target.value);
        },
      });
  },
});

const QEditorStub = defineComponent({
  name: 'QEditorStub',
  props: {
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs, slots }) {
    return () =>
      h('label', { class: 'q-editor' }, [
        ...Object.values(slots).flatMap((slot) => slot?.() ?? []),
        h('textarea', {
          ...attrs,
          value: props.modelValue,
          onInput: (event: Event) => {
            const target = event.target as HTMLTextAreaElement;
            emit('update:modelValue', target.value);
          },
        }),
      ]);
  },
});

const QToggleStub = defineComponent({
  name: 'QToggleStub',
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          class: 'q-toggle',
          type: 'button',
          onClick: () => emit('update:modelValue', !props.modelValue),
        },
        props.label,
      );
  },
});

const QCheckboxStub = defineComponent({
  name: 'QCheckboxStub',
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('label', { ...attrs, class: ['q-checkbox', attrs.class] }, [
        h('input', {
          type: 'checkbox',
          checked: props.modelValue,
          onChange: (event: Event) => {
            emit('update:modelValue', (event.target as HTMLInputElement).checked);
          },
        }),
        props.label,
      ]);
  },
});

const QBadgeStub = defineComponent({
  name: 'QBadgeStub',
  props: {
    color: { type: String, default: '' },
  },
  setup(props, { slots, attrs }) {
    return () =>
      h(
        'span',
        {
          ...attrs,
          class: ['q-badge', props.color ? `bg-${props.color}` : null],
        },
        slotChildren(slots),
      );
  },
});

const QTableStub = defineComponent({
  name: 'QTableStub',
  props: {
    rows: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
  },
  setup(props, { slots, attrs }) {
    function resolveColumnValue(row: Record<string, unknown>, column: Record<string, unknown>) {
      const field = column.field ?? column.name;
      const rawValue = typeof field === 'function' ? field(row) : row[String(field)];

      if (typeof column.format === 'function') {
        return column.format(rawValue, row);
      }

      return rawValue;
    }

    return () => {
      const children = [...slotChildren(slots)];

      if ((props.rows as Array<Record<string, unknown>>).length === 0) {
        children.push(h('div', { class: 'q-table__no-data' }, 'Нет данных'));
      }

      for (const row of props.rows as Array<Record<string, unknown>>) {
        for (const [slotName, slot] of Object.entries(slots)) {
          if (!slotName.startsWith('body-cell-')) {
            continue;
          }
          const columnName = slotName.replace('body-cell-', '');
          children.push(
            ...(slot?.({
              row,
              value: row[columnName],
            }) ?? []),
          );
        }

        children.push(
          h(
            'div',
            { class: 'q-table-row' },
            (props.columns as Array<Record<string, unknown>>).map((column) => {
              const value = resolveColumnValue(row, column);
              return h('span', { class: 'q-table-cell' }, String(value ?? ''));
            }),
          ),
        );
      }

      return h('div', { ...attrs, class: 'q-table' }, children);
    };
  },
});

const QDialogStub = defineComponent({
  name: 'QDialogStub',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { slots, attrs }) {
    return () =>
      props.modelValue ? h('div', { ...attrs, class: 'q-dialog' }, slotChildren(slots)) : null;
  },
});

const QMenuStub = defineComponent({
  name: 'QMenuStub',
  setup(_props, { slots, attrs }) {
    return () => h('div', { ...attrs, class: 'q-menu' }, slotChildren(slots));
  },
});

const QPopupProxyStub = defineComponent({
  name: 'QPopupProxyStub',
  setup(_props, { slots, attrs }) {
    return () => h('div', { ...attrs, class: 'q-popup-proxy' }, slotChildren(slots));
  },
});

const QPopupEditStub = defineComponent({
  name: 'QPopupEdit',
  props: {
    modelValue: { type: [String, Number], default: '' },
  },
  emits: ['save'],
  setup(props, { slots, attrs }) {
    const scope = reactive({ value: props.modelValue });
    return () => h('div', { ...attrs, class: 'q-popup-edit' }, slots.default?.(scope) ?? []);
  },
});

config.global.plugins = [createPinia()];
config.global.stubs = {
  'q-page': wrapTag('div', 'q-page'),
  'q-layout': wrapTag('div', 'q-layout'),
  'q-header': wrapTag('header', 'q-header'),
  'q-toolbar': wrapTag('div', 'q-toolbar'),
  'q-toolbar-title': wrapTag('div', 'q-toolbar-title'),
  'q-drawer': wrapTag('aside', 'q-drawer'),
  'q-list': wrapTag('div', 'q-list'),
  'q-banner': wrapTag('div', 'q-banner'),
  'q-linear-progress': wrapTag('div', 'q-linear-progress'),
  'q-separator': wrapTag('hr', 'q-separator'),
  'q-item-label': wrapTag('div', 'q-item-label'),
  'q-item-section': wrapTag('div', 'q-item-section'),
  'q-page-container': wrapTag('div', 'q-page-container'),
  'q-card': wrapTag('div', 'q-card'),
  'q-card-section': wrapTag('div', 'q-card-section'),
  'q-card-actions': wrapTag('div', 'q-card-actions'),
  'q-space': wrapTag('div', 'q-space'),
  'q-td': wrapTag('td', 'q-td'),
  'q-icon': wrapTag('span', 'q-icon'),
  'q-tooltip': wrapTag('span', 'q-tooltip'),
  'q-spinner': wrapTag('span', 'q-spinner'),
  'q-spinner-dots': wrapTag('span', 'q-spinner-dots'),
  'q-infinite-scroll': wrapTag('div', 'q-infinite-scroll'),
  'q-dialog': QDialogStub,
  'q-menu': QMenuStub,
  'q-popup-proxy': QPopupProxyStub,
  'q-date': QDateStub,
  'q-popup-edit': QPopupEditStub,
  'router-view': wrapTag('div', 'router-view'),
  'q-btn': QBtnStub,
  'q-form': QFormStub,
  'q-input': QInputStub,
  'q-select': QSelectStub,
  'q-editor': QEditorStub,
  'q-toggle': QToggleStub,
  'q-checkbox': QCheckboxStub,
  'q-badge': QBadgeStub,
  'q-table': QTableStub,
  'q-expansion-item': defineComponent({
    name: 'QExpansionItemStub',
    props: {
      modelValue: { type: Boolean, default: false },
      icon: { type: String, default: undefined },
      label: { type: String, default: '' },
      defaultOpened: { type: Boolean, default: false },
      headerClass: { type: String, default: '' },
    },
    emits: ['click', 'update:modelValue'],
    setup(props, { slots, attrs, emit }) {
      return () =>
        h(
          'div',
          {
            ...attrs,
            class: 'q-expansion-item',
            onClick: () => {
              emit('click');
              emit('update:modelValue', !props.modelValue);
            },
          },
          [h('span', { class: 'q-expansion-item__label' }, props.label), ...slotChildren(slots)],
        );
    },
  }),
  'q-pagination': defineComponent({
    name: 'QPaginationStub',
    props: {
      modelValue: { type: Number, default: 1 },
      max: { type: Number, default: 1 },
      maxPages: { type: Number, default: 7 },
      boundaryNumbers: { type: Boolean, default: false },
      directionLinks: { type: Boolean, default: false },
    },
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () =>
        h('div', { ...attrs, class: 'q-pagination' }, [
          h('button', { onClick: () => emit('update:modelValue', props.modelValue + 1) }, ['next']),
        ]);
    },
  }),
  'q-btn-toggle': defineComponent({
    name: 'QBtnToggleStub',
    props: {
      modelValue: { type: [String, Number, Boolean], default: null },
      options: { type: Array, default: () => [] },
    },
    emits: ['update:modelValue'],
    setup(props, { emit, attrs }) {
      return () =>
        h('div', { ...attrs, class: 'q-btn-toggle' }, [
          ...(props.options as Array<Record<string, unknown>>).map((opt) =>
            h(
              'button',
              {
                onClick: () => emit('update:modelValue', opt.value),
                class: props.modelValue === opt.value ? 'active' : '',
              },
              String(opt.label ?? ''),
            ),
          ),
        ]);
    },
  }),
  'q-item': defineComponent({
    name: 'QItemStub',
    props: {
      to: { type: String, default: undefined },
    },
    setup(props, { slots, attrs }) {
      return () => h('div', { ...attrs, class: 'q-item', to: props.to }, slotChildren(slots));
    },
  }),
};
