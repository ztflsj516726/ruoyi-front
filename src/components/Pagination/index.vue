<template>
  <div v-show="!hidden" class="pagination-container">
    <el-pagination
      :background="background"
      :current-page="currentPage"
      :page-size="pageSize"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="total"
      @size-change="onSizeChange"
      @current-change="onCurrentChange"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { scrollTo } from '@/utils/scroll-to'

const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  page: {
    type: Number,
    default: 1
  },
  limit: {
    type: Number,
    default: 20
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50]
  },
  pagerCount: {
    type: Number,
    default: () => (typeof window !== 'undefined' && window.innerWidth < 992 ? 5 : 7)
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  background: {
    type: Boolean,
    default: true
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  hidden: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:page', 'update:limit', 'pagination'])

const currentPage = computed({
  get: () => props.page,
  set: val => emit('update:page', val)
})

const pageSize = computed({
  get: () => props.limit,
  set: val => emit('update:limit', val)
})

// 保证页码在切换 pageSize 时不会超出最大页数
function onSizeChange(val) {
  if (Math.ceil(props.total / val) < currentPage.value) {
    currentPage.value = 1
    emit('update:page', 1)
  }
  emit('update:limit', val)
  emit('pagination')
  if (props.autoScroll) {
    scrollTo(0, 300)
  }
}

function onCurrentChange(val) {
  emit('update:page', val)
  emit('pagination')
  if (props.autoScroll) {
    scrollTo(0, 300)
  }
}

// 监听 total/pageSize 变化自动修正 currentPage
watch(
  () => [props.total, pageSize.value],
  ([total, size]) => {
    const maxPage = Math.max(1, Math.ceil(total / size))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
      emit('update:page', maxPage)
    }
  }
)
</script>

<style scoped>
.pagination-container {
  background: #fff;
  padding: 16px 0 0 0;
  text-align: right;
}
</style>