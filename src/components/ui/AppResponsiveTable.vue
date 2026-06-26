<template>
  <div class="app-responsive-table">
    <div class="app-responsive-table__desktop gt-xs">
      <q-table
        v-bind="tableAttrs"
        :rows="rows"
        :columns="columns"
        :row-key="rowKey"
        :loading="loading"
        :pagination="resolvedPagination"
        @update:pagination="emit('update:pagination', $event)"
        @request="emit('request', $event)"
      >
        <template
          v-for="slotName in tableSlotNames"
          #[slotName]="scope"
          :key="slotName"
        >
          <slot :name="slotName" v-bind="scope || {}" />
        </template>
      </q-table>
    </div>

    <div class="app-responsive-table__mobile xs">
      <div v-if="loading" class="text-grey-7 q-pa-md text-center">
        Загрузка...
      </div>

      <div v-else-if="rows.length === 0" class="text-grey-7 q-pa-md text-center">
        Нет данных
      </div>

      <div v-else class="column q-gutter-sm">
        <q-infinite-scroll
          v-if="hasMore"
          :offset="96"
          :disable="loadingMore || !hasMore"
          @load="handleLoadMore"
        >
          <template
            v-for="row in rows"
            :key="getRowKey(row)"
          >
            <q-card flat bordered class="app-responsive-table__card">
              <q-card-section class="q-pa-md">
                <div class="row items-start no-wrap q-gutter-sm">
                  <div class="col">
                    <div class="text-subtitle2 text-weight-medium">
                      {{ mobile.title(row) }}
                    </div>
                    <div v-if="mobile.subtitle" class="text-caption text-grey-7 q-mt-xs">
                      {{ mobile.subtitle(row) }}
                    </div>
                  </div>

                  <q-badge
                    v-if="getBadge(row)"
                    :color="getBadge(row)?.color"
                    class="app-responsive-table__badge"
                  >
                    {{ getBadge(row)?.label }}
                  </q-badge>
                </div>

                <div class="app-responsive-table__fields q-mt-md">
                  <div
                    v-for="field in mobile.fields"
                    :key="field.name"
                    class="app-responsive-table__field row items-start no-wrap q-py-xs"
                  >
                    <div class="app-responsive-table__field-label text-caption text-grey-7">
                      {{ field.label }}
                    </div>
                    <div class="app-responsive-table__field-value text-body2 text-right">
                      <slot
                        :name="`mobile-field-${field.name}`"
                        :row="row"
                        :value="getMobileFieldValue(row, field)"
                      >
                        {{ getMobileFieldValue(row, field) }}
                      </slot>
                    </div>
                  </div>
                </div>

                <div v-if="$slots['mobile-actions']" class="q-mt-md">
                  <slot name="mobile-actions" :row="row" />
                </div>
              </q-card-section>
            </q-card>
          </template>
          <template #loading>
            <div class="row justify-center q-pa-sm text-grey-7">
              Загрузка...
            </div>
          </template>
        </q-infinite-scroll>
        <template v-else>
          <q-card
            v-for="row in rows"
            :key="getRowKey(row)"
            flat
            bordered
            class="app-responsive-table__card"
          >
            <q-card-section class="q-pa-md">
              <div class="row items-start no-wrap q-gutter-sm">
                <div class="col">
                  <div class="text-subtitle2 text-weight-medium">
                    {{ mobile.title(row) }}
                  </div>
                  <div v-if="mobile.subtitle" class="text-caption text-grey-7 q-mt-xs">
                    {{ mobile.subtitle(row) }}
                  </div>
                </div>

                <q-badge
                  v-if="getBadge(row)"
                  :color="getBadge(row)?.color"
                  class="app-responsive-table__badge"
                >
                  {{ getBadge(row)?.label }}
                </q-badge>
              </div>

              <div class="app-responsive-table__fields q-mt-md">
                <div
                  v-for="field in mobile.fields"
                  :key="field.name"
                  class="app-responsive-table__field row items-start no-wrap q-py-xs"
                >
                  <div class="app-responsive-table__field-label text-caption text-grey-7">
                    {{ field.label }}
                  </div>
                  <div class="app-responsive-table__field-value text-body2 text-right">
                    <slot
                      :name="`mobile-field-${field.name}`"
                      :row="row"
                      :value="getMobileFieldValue(row, field)"
                    >
                      {{ getMobileFieldValue(row, field) }}
                    </slot>
                  </div>
                </div>
              </div>

              <div v-if="$slots['mobile-actions']" class="q-mt-md">
                <slot name="mobile-actions" :row="row" />
              </div>
            </q-card-section>
          </q-card>
        </template>
        <div v-if="loadingMore" class="row justify-center q-pa-sm text-grey-7">
          Загрузка...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QTableColumn } from 'quasar';
import { computed, useAttrs, useSlots } from 'vue';

type TableRow = Record<string, unknown>;

type MobileBadge = {
  label: string;
  color?: string;
};

type MobileField = {
  name: string;
  label: string;
  field?: string | ((row: TableRow) => unknown);
  format?: (value: unknown, row: TableRow) => string;
};

type MobileConfig = {
  title: (row: TableRow) => string | number;
  subtitle?: (row: TableRow) => string | number;
  badge?: (row: TableRow) => MobileBadge | null | undefined;
  fields: MobileField[];
};

const props = withDefaults(
  defineProps<{
    rows: TableRow[];
    columns: QTableColumn<TableRow>[];
    rowKey?: string | ((row: TableRow) => string | number);
    loading?: boolean;
    loadingMore?: boolean;
    hasMore?: boolean;
    pagination?: Record<string, unknown>;
    mobile: MobileConfig;
  }>(),
  {
    rowKey: 'id',
    loading: false,
    loadingMore: false,
    hasMore: false,
    pagination: () => ({ rowsPerPage: 0 }),
  },
);

const emit = defineEmits<{
  (event: 'update:pagination', value: Record<string, unknown>): void;
  (event: 'request', value: unknown): void;
  (event: 'load-more', value: { done: () => void }): void;
}>();

const attrs = useAttrs();
const slots = useSlots();

const tableAttrs = computed(() => attrs);
const resolvedPagination = computed(() => props.pagination);
const tableSlotNames = computed(() =>
  Object.keys(slots).filter((slotName) => !slotName.startsWith('mobile-')),
);

function handleLoadMore(_: number, done: () => void) {
  if (!props.hasMore || props.loadingMore) {
    done();
    return;
  }
  emit('load-more', { done });
}

function getRowKey(row: TableRow) {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row);
  }

  return String(row[props.rowKey] ?? JSON.stringify(row));
}

function getBadge(row: TableRow) {
  return props.mobile.badge?.(row);
}

function getMobileFieldValue(row: TableRow, field: MobileField) {
  const column = props.columns.find((item) => item.name === field.name);
  const value = resolveFieldValue(row, field.field ?? column?.field ?? field.name);
  const formatter = field.format ?? column?.format;

  if (formatter) {
    return formatter(value, row);
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

function resolveFieldValue(
  row: TableRow,
  field: string | ((row: TableRow) => unknown),
) {
  if (typeof field === 'function') {
    return field(row);
  }

  return row[field];
}

</script>

<style scoped>
.app-responsive-table__card {
  border-radius: 8px;
}

.app-responsive-table__badge {
  white-space: nowrap;
}

.app-responsive-table__fields {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.app-responsive-table__field {
  gap: 12px;
}

.app-responsive-table__field-label {
  flex: 0 0 42%;
}

.app-responsive-table__field-value {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
