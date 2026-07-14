<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Рассылка</div>

    <div class="row items-stretch q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-card class="broadcast-panel full-height">
          <q-card-section class="broadcast-card-body column full-height">
            <q-form class="editor-form column full-height">
              <div class="editor-shell col">
                <q-editor
                  v-model="form.text"
                  class="broadcast-editor full-width fit"
                  min-height="100%"
                  :toolbar="editorToolbar"
                >
                  <template #emoji>
                    <q-btn flat dense no-caps size="sm" color="grey-8" label="Эмодзи">
                      <q-menu anchor="bottom left" self="top left">
                        <div class="emoji-picker q-pa-sm">
                          <q-input
                            v-model="emojiQuery"
                            dense
                            outlined
                            label="Поиск эмодзи"
                            class="q-mb-sm"
                          />
                          <div class="emoji-menu">
                            <button
                              v-for="emoji in filteredEmojiOptions"
                              :key="emoji"
                              type="button"
                              class="emoji-button"
                              @click="insertEmoji(emoji)"
                            >
                              {{ emoji }}
                            </button>
                          </div>
                        </div>
                      </q-menu>
                    </q-btn>
                  </template>
                </q-editor>
              </div>

              <div class="q-pt-md">
                <q-toggle
                  v-model="isPaid"
                  :label="isPaid ? 'Платный режим до 1000 msg/s' : 'Бесплатный режим'"
                  class="q-mb-md"
                />

                <q-input v-model="form.buttonText" label="Текст кнопки" class="q-mb-sm" />
                <q-input v-model="form.buttonUrl" label="URL / WebApp" class="q-mb-md" />

                <q-btn
                  color="primary"
                  label="Отправить"
                  type="button"
                  size="sm"
                  no-caps
                  unelevated
                  class="send-button"
                  :loading="sending"
                  @click="openConfirm"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="broadcast-panel full-height">
          <q-card-section class="panel-heading">
            <div class="text-subtitle1">Preview</div>
          </q-card-section>

          <q-card-section class="broadcast-card-body column full-height q-pt-none">
            <div class="preview-surface col full-width">
              <div class="preview-html" v-html="previewHtml"></div>
            </div>

            <div class="q-pt-md">
              <q-btn
                v-if="form.buttonText && form.buttonUrl"
                outline
                color="primary"
                :label="form.buttonText"
              />
              <div v-if="isPaid" class="text-caption text-negative q-mt-md">
                Платный режим может списывать Stars по правилам Telegram.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">История рассылок</div>
        <AppResponsiveTable
          :rows="broadcasts"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :loading-more="loadingMore"
          :has-more="hasMore"
          :pagination="pagination"
          :mobile="mobileConfig"
          table-style="table-layout: fixed; width: 100%"
          flat
          bordered
          @request="handleTableRequest"
          @update:pagination="handlePaginationUpdate"
          @load-more="handleLoadMore"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)">
                {{ props.row.status }}
              </q-badge>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                v-if="isBroadcastActive(props.row)"
                dense
                unelevated
                no-caps
                color="warning"
                icon="stop_circle"
                label="Остановить"
                :loading="stoppingIds.has(props.row.id)"
                @click="stopBroadcast(props.row)"
              />
            </q-td>
          </template>

          <template #mobile-actions="{ row }">
            <q-btn
              v-if="isBroadcastActive(row)"
              dense
              unelevated
              no-caps
              color="warning"
              icon="stop_circle"
              label="Остановить"
              :loading="stoppingIds.has(row.id)"
              @click="stopBroadcast(row)"
            />
          </template>
        </AppResponsiveTable>
      </q-card-section>
    </q-card>

    <q-dialog v-model="confirmOpen">
      <q-card class="full-width">
        <q-card-section>
          <div class="text-h6">Подтверждение рассылки</div>
        </q-card-section>
        <q-card-section>
          <div class="preview-html q-mb-md" v-html="previewHtml"></div>
          <div v-if="form.buttonText && form.buttonUrl" class="q-mb-md">
            Кнопка: {{ form.buttonText }}
          </div>
          <div class="text-caption">Режим: {{ isPaid ? 'paid' : 'free' }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" @click="confirmOpen = false" />
          <q-btn color="primary" label="Подтвердить" :loading="sending" @click="submitBroadcast" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from '@boot/axios';
import AppResponsiveTable from '@components/ui/AppResponsiveTable.vue';
import {
  hasTelegramRenderableContent,
  normalizeTelegramHtml,
  telegramPreviewHtml,
} from '@utils/telegramHtml';
import { formatAdminDateTime } from '@utils/date';

type BroadcastRow = {
  id: number;
  status: string;
  text: string;
  speed_mode_requested: string;
  total_count?: number;
  success_count?: number;
  failed_count?: number;
  createdAt?: string;
  last_error?: string | null;
};

const $q = useQuasar();
const loading = ref(false);
const loadingMore = ref(false);
const sending = ref(false);
const confirmOpen = ref(false);
const broadcasts = ref<BroadcastRow[]>([]);
const hasMore = ref(false);
const stoppingIds = ref(new Set<number>());
const isPaid = ref(false);
const emojiQuery = ref('');
const form = ref({
  text: '<p></p>',
  buttonText: '',
  buttonUrl: '',
});
let pollTimer: number | null = null;
const pagination = ref({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});
const editorToolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered'],
  ['quote', 'link'],
  ['emoji'],
  ['undo', 'redo'],
];

const columns = [
  {
    name: 'createdAt',
    label: 'Дата',
    field: 'createdAt',
    align: 'left' as const,
    style: 'width: 16%',
    format: (value: string | undefined) => formatAdminDateTime(value),
  },
  { name: 'status', label: 'Статус', field: 'status', align: 'left' as const, style: 'width: 12%' },
  {
    name: 'speed_mode_requested',
    label: 'Режим',
    field: 'speed_mode_requested',
    align: 'left' as const,
    style: 'width: 10%',
  },
  {
    name: 'counts',
    label: 'Итог',
    field: (row: BroadcastRow) =>
      `${row.total_count ?? 0}/${row.success_count ?? 0}/${row.failed_count ?? 0}`,
    align: 'right' as const,
    style: 'width: 12%',
  },
  {
    name: 'text',
    label: 'Текст',
    field: 'text',
    align: 'left' as const,
    style:
      'width: 30%; max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
  },
  {
    name: 'last_error',
    label: 'Ошибка',
    field: 'last_error',
    align: 'left' as const,
    style:
      'width: 20%; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
    style: 'width: 14%',
  },
];

const mobileConfig = {
  title: (row: BroadcastRow) => row.text || `Рассылка ${row.id}`,
  subtitle: (row: BroadcastRow) => formatAdminDateTime(row.createdAt),
  badge: (row: BroadcastRow) => ({ label: row.status, color: statusColor(row.status) }),
  fields: [
    { name: 'speed_mode_requested', label: 'Режим' },
    { name: 'counts', label: 'Итог' },
    { name: 'last_error', label: 'Ошибка' },
  ],
};

const normalizedMessageHtml = computed(() => normalizeTelegramHtml(form.value.text));
const previewHtml = computed(() => telegramPreviewHtml(normalizedMessageHtml.value));
const emojiCatalog = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😃',
  '😄',
  '😅',
  '😆',
  '😉',
  '😊',
  '🙂',
  '🙃',
  '😉',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '🤗',
  '🤩',
  '🥳',
  '😎',
  '🤓',
  '🧐',
  '🤠',
  '😏',
  '😌',
  '😇',
  '🥹',
  '😋',
  '😜',
  '🤪',
  '😝',
  '🫠',
  '🤭',
  '🤫',
  '🤔',
  '🫡',
  '🤝',
  '👍',
  '👎',
  '👏',
  '🙌',
  '🙏',
  '💪',
  '👀',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '💔',
  '❤️‍🔥',
  '❤️‍🩹',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '💯',
  '🔥',
  '✨',
  '⭐',
  '🌟',
  '⚡',
  '💥',
  '☀️',
  '🌤️',
  '⛅',
  '🌈',
  '☁️',
  '❄️',
  '☔',
  '💧',
  '🌊',
  '🍀',
  '🌹',
  '🌸',
  '🌻',
  '🌼',
  '🍎',
  '🍊',
  '🍋',
  '🍓',
  '🍒',
  '🍉',
  '🥝',
  '🍍',
  '🍔',
  '🍕',
  '🌭',
  '🥪',
  '🌮',
  '🌯',
  '🍣',
  '🍜',
  '🍩',
  '🍪',
  '🎂',
  '🍰',
  '☕',
  '🫖',
  '🍵',
  '🥤',
  '🍷',
  '🍾',
  '🥂',
  '🎉',
  '🎊',
  '🎁',
  '🏆',
  '🥇',
  '⚽',
  '🏀',
  '🏐',
  '🎾',
  '🏓',
  '🎳',
  '🎮',
  '🎯',
  '🎲',
  '🧩',
  '🎸',
  '🎹',
  '🎤',
  '🎧',
  '📣',
  '🔔',
  '📢',
  '🚀',
  '✈️',
  '🚗',
  '🛵',
  '🛍️',
  '💸',
  '💵',
  '💶',
  '💷',
  '💴',
  '💳',
  '🪙',
  '📈',
  '📉',
  '💼',
  '📦',
  '🛒',
  '🏦',
  '🧾',
  '📌',
  '📍',
  '📝',
  '✏️',
  '📎',
  '📅',
  '⏰',
  '⌛',
  '📱',
  '💻',
  '🖥️',
  '⌨️',
  '🖱️',
  '🔋',
  '🔒',
  '🔓',
  '🛡️',
  '⚙️',
  '🧠',
  '👨‍💻',
  '👩‍💻',
  '🤖',
  '✅',
  '☑️',
  '✔️',
  '❌',
  '⚠️',
  '❗',
  '❓',
  '⭕',
  '🔴',
  '🟠',
  '🟡',
  '🟢',
  '🔵',
  '🟣',
  '⚪',
  '⚫',
  '⬆️',
  '⬇️',
  '⬅️',
  '➡️',
  '↗️',
  '↘️',
  '↙️',
  '↖️',
  '🔁',
  '🔄',
  '📤',
  '📥',
  '📨',
  '✉️',
  '📩',
  '💬',
  '🗨️',
  '📣',
  '👋',
  '🤝',
  '🫶',
  '👌',
  '🤌',
  '✌️',
  '🤞',
  '🫰',
  '🤟',
  '🤘',
  '👑',
  '💎',
  '🧨',
  '🕯️',
  '🏁',
  '🚨',
];
const filteredEmojiOptions = computed(() => {
  const query = emojiQuery.value.trim();

  if (!query) {
    return emojiCatalog;
  }

  return emojiCatalog.filter((emoji) => emoji.includes(query));
});

function insertEmoji(emoji: string) {
  const currentText = form.value.text.trim();

  if (!currentText || currentText === '<p></p>') {
    form.value.text = `<p>${emoji}</p>`;
    return;
  }

  if (currentText.endsWith('</p>')) {
    form.value.text = currentText.replace(/<\/p>\s*$/, `${emoji}</p>`);
    return;
  }

  form.value.text = `${currentText}${emoji}`;
}

function validateForm() {
  if (!hasTelegramRenderableContent(form.value.text)) {
    $q.notify({ type: 'negative', message: 'Введите текст рассылки' });
    return false;
  }

  const hasButtonText = Boolean(form.value.buttonText.trim());
  const hasButtonUrl = Boolean(form.value.buttonUrl.trim());
  if (hasButtonText !== hasButtonUrl) {
    $q.notify({ type: 'negative', message: 'Текст кнопки и URL должны быть заполнены вместе' });
    return false;
  }

  return true;
}

function isBroadcastActive(row: BroadcastRow) {
  return row.status === 'pending' || row.status === 'running';
}

function statusColor(statusValue: string) {
  const colors: Record<string, string> = {
    completed: 'positive',
    failed: 'negative',
    stopped: 'warning',
    running: 'primary',
    pending: 'grey',
  };

  return colors[statusValue] ?? 'grey';
}

function startPollingIfNeeded() {
  const hasRunning = broadcasts.value.some((item) => isBroadcastActive(item));
  if (!hasRunning || pollTimer !== null) {
    return;
  }

  pollTimer = window.setInterval(() => {
    void loadBroadcasts();
  }, 2000);
}

function stopPollingIfDone() {
  const hasRunning = broadcasts.value.some((item) => isBroadcastActive(item));
  if (!hasRunning && pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function loadBroadcasts() {
  const limit = pagination.value.rowsPerPage;
  const offset = (pagination.value.page - 1) * limit;
  loading.value = true;
  try {
    const response = await api.get<{
      items: BroadcastRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/broadcasts', {
      params: { limit, offset },
    });
    const payload = Array.isArray(response.data)
      ? { items: response.data, total: response.data.length, limit, offset }
      : response.data;
    broadcasts.value = payload.items;
    pagination.value = {
      ...pagination.value,
      rowsNumber: payload.total,
      rowsPerPage: payload.limit,
      page: Math.floor(payload.offset / payload.limit) + 1,
    };
    hasMore.value = payload.offset + payload.items.length < payload.total;
    startPollingIfNeeded();
    stopPollingIfDone();
  } catch {
    broadcasts.value = [];
    pagination.value = { ...pagination.value, rowsNumber: 0 };
    hasMore.value = false;
    stopPollingIfDone();
  } finally {
    loading.value = false;
  }
}

async function handleTableRequest(payload: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value = { ...pagination.value, ...payload.pagination };
  await loadBroadcasts();
}

function handlePaginationUpdate(value: Record<string, unknown>) {
  pagination.value = { ...pagination.value, ...value };
}

async function handleLoadMore({ done }: { done: () => void }) {
  if (loadingMore.value || !hasMore.value) {
    done();
    return;
  }
  loadingMore.value = true;
  try {
    const response = await api.get<{
      items: BroadcastRow[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/admin/broadcasts', {
      params: {
        limit: pagination.value.rowsPerPage,
        offset: broadcasts.value.length,
      },
    });
    const payload = Array.isArray(response.data)
      ? {
          items: response.data,
          total: response.data.length,
          limit: pagination.value.rowsPerPage,
          offset: broadcasts.value.length,
        }
      : response.data;
    broadcasts.value = [...broadcasts.value, ...payload.items];
    pagination.value = { ...pagination.value, rowsNumber: payload.total };
    hasMore.value = payload.offset + payload.items.length < payload.total;
  } finally {
    loadingMore.value = false;
    done();
  }
}

function openConfirm() {
  if (!validateForm()) {
    return;
  }
  confirmOpen.value = true;
}

async function submitBroadcast() {
  if (!validateForm()) {
    return;
  }

  sending.value = true;
  try {
    const response = await api.post('/api/admin/broadcasts', {
      text: normalizedMessageHtml.value,
      format: 'html',
      button_text: form.value.buttonText.trim() || null,
      button_url: form.value.buttonUrl.trim() || null,
      speed_mode: isPaid.value ? 'paid' : 'free',
    });
    if (pagination.value.page === 1) {
      broadcasts.value = [response.data, ...broadcasts.value].slice(
        0,
        pagination.value.rowsPerPage,
      );
      pagination.value = { ...pagination.value, rowsNumber: pagination.value.rowsNumber + 1 };
    } else {
      await loadBroadcasts();
    }
    confirmOpen.value = false;
    form.value = { text: '<p></p>', buttonText: '', buttonUrl: '' };
    isPaid.value = false;
    startPollingIfNeeded();
    $q.notify({ type: 'positive', message: 'Рассылка запущена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось запустить рассылку' });
  } finally {
    sending.value = false;
  }
}

async function stopBroadcast(row: BroadcastRow) {
  if (stoppingIds.value.has(row.id)) {
    return;
  }

  stoppingIds.value = new Set(stoppingIds.value).add(row.id);
  try {
    const response = await api.post(`/api/admin/broadcasts/${row.id}/stop`);
    broadcasts.value = broadcasts.value.map((item) => (item.id === row.id ? response.data : item));
    stopPollingIfDone();
    $q.notify({ type: 'positive', message: 'Рассылка остановлена' });
  } catch {
    $q.notify({ type: 'negative', message: 'Не удалось остановить рассылку' });
  } finally {
    const nextStoppingIds = new Set(stoppingIds.value);
    nextStoppingIds.delete(row.id);
    stoppingIds.value = nextStoppingIds;
  }
}

onMounted(async () => {
  await loadBroadcasts();
});

onBeforeUnmount(() => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style scoped>
.broadcast-panel {
  display: flex;
  flex-direction: column;
}

.broadcast-card-body,
.editor-form,
.editor-shell,
.preview-surface {
  width: 100%;
}

.broadcast-card-body,
.editor-form {
  flex: 1 1 auto;
}

.editor-shell {
  min-height: 360px;
}

.broadcast-editor {
  height: 100%;
  min-height: 360px;
}

.broadcast-editor :deep(.q-editor__content),
.broadcast-editor :deep(.q-editor__content-container),
.broadcast-editor :deep(.q-editor__content[contenteditable='true']) {
  min-height: 300px;
  height: 100%;
}

.preview-surface {
  min-height: 360px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 16px;
}

.send-button {
  min-width: 132px;
  align-self: flex-start;
}

.emoji-menu {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  width: 252px;
}

.emoji-button {
  border: 0;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 8px;
}

.emoji-button:hover {
  background: rgba(0, 0, 0, 0.06);
}

.preview-text,
.preview-html {
  min-height: 100%;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
