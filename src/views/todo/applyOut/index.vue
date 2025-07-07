<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px"
      label-suffix="：">
      <template v-for="item in queryFormItems" :key="item.prop">
        <el-form-item :label="item.label" :prop="item.prop">
          <component :is="item.type" v-model="queryParams[item.prop]" v-bind="item.attrs"
            @keyup.enter.native="item.onEnter ? handleQuery : null">
            <template v-if="item.type === 'el-select'">
              <el-option v-for="dict in item.options" :key="dict?.value" :label="dict?.label" :value="dict?.value" />
            </template>
          </component>
        </el-form-item>
      </template>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="assetList">
      <el-table-column label="申请原因" align="center" prop="reason" />
      <el-table-column label="申请单号" align="center" prop="applyCode" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="{ row }">
          <dict-tag :options="asset_apply_status" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="部门" align="center" prop="deptName" />
      <el-table-column label="申请人" align="center" prop="createBy" />
      <el-table-column label="申请时间" align="center" prop="createTime" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handle(row)" v-if="row.status === 'pending'">处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改物资信息对话框 -->
    <el-dialog title="物资申请审批" v-model="open" width="700px" append-to-body align-center>
      <el-form ref="formRef" :model="form" label-width="100px" label-suffix="：">
        <template v-for="item in formItems" :key="item.prop">
          <el-form-item :label="item.label" :prop="item.prop">
            <component :is="item.type" v-model="form[item.prop]" v-bind="item.attrs">
              <template v-if="item.type === 'el-select'">
                <el-option v-for="dict in item.options" :key="dict?.value" :label="dict?.label" :value="dict?.value" />
              </template>
            </component>
          </el-form-item>
        </template>
        <el-form-item label="物资列表">
          <el-table border height="300px" :data="form.detailList">
            <el-table-column label="物资" align="center">
              <template #default="{ row }">
                <dict-tag :options="assetListOptions" :value="row.assetId" />
              </template>
            </el-table-column>
            <el-table-column label="数量" align="center" prop="count" />
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm('approve')">同 意</el-button>
        <el-button type="danger" @click="submitForm('rejected')">驳 回</el-button>
        <el-button @click="cancel">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="applyIn">
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { listAsset } from "@/api/asset"
import { applyOutDetail } from "@/api/assetOutApply"
import * as myTodoApi from '@/api/mytodo'

const { proxy } = getCurrentInstance()
const { asset_apply_status } = proxy.useDict("asset_apply_status")


// refs
const queryForm = ref(null)
const formRef = ref(null)

// 状态
const loading = ref(false)
let showSearch = ref(true)
const total = ref(0)
const assetList = ref([])
const open = ref(false)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  status: 'pending'
})

// 表单数据
const form = reactive({
  detailList: [],
})


// 查询表单项配置
const queryFormItems = reactive([
  { label: "状态", prop: "status", type: "el-select", options: asset_apply_status, attrs: { placeholder: "请选择类别", clearable: true, style: "width: 200px", filterable: true }, onEnter: true },
  { label: "申请单号", prop: "applyCode", type: "el-input",  attrs: { placeholder: "请输入申请单号", clearable: true, style: "width: 200px", filterable: true }, onEnter: true },
])

// 编辑表单项配置
const formItems = reactive([
  { label: "申请原因", prop: "reason", type: "el-input", attrs: { placeholder: "请输入申请原因", disabled: true } },
])

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await myTodoApi.myToList(queryParams)
    assetList.value = response.data
    total.value = response.total
  } catch (e) {
    proxy.$modal.msgError("获取数据失败")
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  open.value = false
  reset()
}
function resetForm(refName) {
  if (refName === "form" && formRef.value) {
    formRef.value.resetFields()
  } else if (refName === "queryForm" && queryForm.value) {
    queryForm.value.resetFields()
  }
}

const reset = () => {
  Object.keys(form).forEach(key => form[key] = null)
  resetForm("form")
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  resetForm("queryForm")
  handleQuery()
}

const handle = (row) => {
  currentRow = row
  reset()
  applyOutDetail(row.id).then(res => {
    open.value = true
    Object.assign(form, res.data)
  })
}
let currentRow = {}
const submitForm = (type) => {
  let handle = type === 'approve' ? myTodoApi.approve : myTodoApi.reject
  let msg = type === 'approve' ? '同意' : '拒绝'
  proxy.$modal.confirm(`是否${msg}该申请单？`).then(() => {
    return handle(currentRow.id)
  })
    .then(() => {
      proxy.$modal.msgSuccess('处理成功')
      open.value = false
      getList()
    })
}

let assetListOptions = ref([])
const getAssetList = () => {
  listAsset({ pageNum: 1, pageSize: 9999 }).then(res => {
    assetListOptions.value = res.data.map(item => {
      return {
        label: item.name,
        value: item.id,
      }
    })
  })
}

onMounted(() => {
  getList()
  getAssetList()
})
</script>
