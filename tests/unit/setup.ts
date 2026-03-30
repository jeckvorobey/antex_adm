import { config } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { vi } from 'vitest';

const notifyCreate = vi.fn();
const dialogCreate = vi.fn();

vi.mock('quasar', () => {
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
    notify: (...args: unknown[]) => Notify.create(...args),
    dialog: (...args: unknown[]) => Dialog.create(...args),
  });

  return { Quasar, Notify, Dialog, useQuasar };
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
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('label', { class: 'q-input' }, [
        h('input', {
          ...attrs,
          type: props.type,
          value: String(props.modelValue ?? ''),
          onInput: (event: Event) => {
            const target = event.target as HTMLInputElement;
            const nextValue =
              props.type === 'number' ? Number(target.value || '0') : target.value;
            emit('update:modelValue', nextValue);
          },
        }),
      ]);
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
  },
  setup(props, { slots, attrs }) {
    return () => {
      const children = [...slotChildren(slots)];

      for (const row of props.rows as Array<Record<string, unknown>>) {
        if (slots['body-cell-isActive']) {
          children.push(
            ...(slots['body-cell-isActive']({
              row,
              value: row.isActive,
            }) ?? []),
          );
        }

        children.push(
          h(
            'div',
            { class: 'q-table-row' },
            Object.values(row).map((value) =>
              h('span', { class: 'q-table-cell' }, String(value)),
            ),
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
      props.modelValue
        ? h('div', { ...attrs, class: 'q-dialog' }, slotChildren(slots))
        : null;
  },
});

const QMenuStub = defineComponent({
  name: 'QMenuStub',
  setup(_props, { slots, attrs }) {
    return () => h('div', { ...attrs, class: 'q-menu' }, slotChildren(slots));
  },
});

config.global.plugins = [];
config.global.stubs = {
  'q-page': wrapTag('div', 'q-page'),
  'q-layout': wrapTag('div', 'q-layout'),
  'q-header': wrapTag('header', 'q-header'),
  'q-toolbar': wrapTag('div', 'q-toolbar'),
  'q-toolbar-title': wrapTag('div', 'q-toolbar-title'),
  'q-drawer': wrapTag('aside', 'q-drawer'),
  'q-list': wrapTag('div', 'q-list'),
  'q-item-label': wrapTag('div', 'q-item-label'),
  'q-item-section': wrapTag('div', 'q-item-section'),
  'q-page-container': wrapTag('div', 'q-page-container'),
  'q-card': wrapTag('div', 'q-card'),
  'q-card-section': wrapTag('div', 'q-card-section'),
  'q-card-actions': wrapTag('div', 'q-card-actions'),
  'q-space': wrapTag('div', 'q-space'),
  'q-td': wrapTag('td', 'q-td'),
  'q-icon': wrapTag('span', 'q-icon'),
  'q-dialog': QDialogStub,
  'q-menu': QMenuStub,
  'router-view': wrapTag('div', 'router-view'),
  'q-btn': QBtnStub,
  'q-form': QFormStub,
  'q-input': QInputStub,
  'q-editor': QEditorStub,
  'q-toggle': QToggleStub,
  'q-badge': QBadgeStub,
  'q-table': QTableStub,
  'q-item': defineComponent({
    name: 'QItemStub',
    props: {
      to: { type: String, default: undefined },
    },
    setup(props, { slots, attrs }) {
      return () =>
        h(
          'div',
          { ...attrs, class: 'q-item', to: props.to },
          slotChildren(slots),
        );
    },
  }),
};
