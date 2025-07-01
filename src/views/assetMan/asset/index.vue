<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">
          新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate">
          修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete">
          删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport">
          导出
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="assetList" @selection-change="handleSelectionChange"
      :row-class-name="rowClass">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="物资名称" align="center" prop="name" />
      <el-table-column label="类别" align="center" prop="category">
        <template #default="scope">
          <dict-tag :options="asset_type" :value="scope.row.category" />
        </template>
      </el-table-column>
      <el-table-column label="规格型号" align="center" prop="model" />
      <el-table-column label="总库存" align="center" prop="totalStock" />
      <el-table-column label="可用库存" align="center" prop="usableStock" />
      <el-table-column label="告警阈值" align="center" prop="minThreshold">
        <template #default="{ row }">
          <span style="color: #a70000;" v-if="row.minThreshold >= row.usableStock">{{ row?.minThreshold }}</span>
          <span v-else>{{ row?.minThreshold }}</span>
        </template>
      </el-table-column>
      <el-table-column label="购入日期" align="center" prop="purchaseDate" width="180" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)">修改</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改物资信息对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <template v-for="item in formItems" :key="item.prop">
          <el-form-item :label="item.label" :prop="item.prop">
            <component :is="item.type" v-model="form[item.prop]" v-bind="item.attrs">
              <template v-if="item.type === 'el-select'">
                <el-option v-for="dict in item.options" :key="dict?.value" :label="dict?.label" :value="dict?.value" />
              </template>
            </component>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="asset">
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { listAsset, getAsset, delAsset, addAsset, updateAsset } from "@/api/asset"
import { rowProps } from "element-plus"

const { proxy } = getCurrentInstance()
const { asset_type, asset_unit } = proxy.useDict("asset_type", "asset_unit")

// refs
const queryForm = ref(null)
const formRef = ref(null)

// 状态
const loading = ref(false)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
let showSearch = ref(true)
const total = ref(0)
const assetList = ref([])
const title = ref("")
const open = ref(false)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: null,
  category: null,
  model: null,
  unit: null,
  totalStock: null,
  usableStock: null,
  purchaseDate: null,
})

// 表单数据
const form = reactive({
  id: null,
  name: null,
  category: null,
  model: null,
  unit: null,
  totalStock: null,
  usableStock: null,
  purchaseDate: null,
  remark: null,
  createTime: null,
  updateTime: null,
})

// 校验规则
const rules = {
  name: [{ required: true, message: "物资名称不能为空", trigger: "blur" }],
  category: [{ required: true, message: "类别不能为空", trigger: "blur" }],
}

// 查询表单项配置
const queryFormItems = reactive([
  { label: "物资名称", prop: "name", type: "el-input", attrs: { placeholder: "请输入物资名称", clearable: true }, onEnter: true },
  { label: "类别", prop: "category", type: "el-select", options: asset_type, attrs: { placeholder: "请选择类别", clearable: true, style: "width: 200px" }, onEnter: true },
  { label: "规格型号", prop: "model", type: "el-input", attrs: { placeholder: "请输入规格型号", clearable: true }, onEnter: true },
  { label: "购入日期", prop: "purchaseDate", type: "el-date-picker", attrs: { clearable: true, 'value-format': "YYYY-MM-DD", placeholder: "请选择购入日期", style: "width: 200px" } },
])

// 编辑表单项配置
const formItems = reactive([
  { label: "物资名称", prop: "name", type: "el-input", attrs: { placeholder: "请输入物资名称" } },
  { label: "类别", prop: "category", type: "el-select", options: asset_type, attrs: { placeholder: "请选择类别", style: "width: 100%" } },
  { label: "规格型号", prop: "model", type: "el-input", attrs: { placeholder: "请输入规格型号" } },
  { label: "告警阈值", prop: "minThreshold", type: "el-input-number", attrs: { placeholder: "请输入告警阈值", clearable: true, min: 0 }, onEnter: true },
  { label: "购入日期", prop: "purchaseDate", type: "el-date-picker", attrs: { clearable: true, 'value-format': "YYYY-MM-DD", placeholder: "请选择购入日期", style: "width: 200px" } },
  { label: "备注", prop: "remark", type: "el-input", attrs: { placeholder: "请输入备注", type: 'textarea' } },
])

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await listAsset(queryParams)
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

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加物资信息"
}

const handleUpdate = (row) => {
  reset()
  const id = row?.id || ids.value
  getAsset(id).then((response) => {
    Object.assign(form, response.data)
    open.value = true
    title.value = "修改物资信息"
  })
}

const submitForm = () => {
  if (!formRef.value) return
  formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      const req = form.id != null ? updateAsset(form) : addAsset(form)
      req.then(() => {
        proxy.$modal.msgSuccess(form.id != null ? "修改成功" : "新增成功")
        open.value = false
        getList()
      })
        .catch(() => {
          proxy.$modal.msgError(form.id != null ? "修改失败" : "新增失败")
        })
        .finally(() => {
          loading.value = false
        })
    }
  })
}

const handleDelete = (row) => {
  const deleteIds = row?.id || ids.value
  proxy.$modal.confirm('是否确认删除物资信息编号为"' + deleteIds + '"的数据项？')
    .then(() => delAsset(deleteIds))
    .then(() => {
      getList()
      proxy.$modal.msgSuccess("删除成功")
    })
    .catch(() => { })
}

const handleExport = () => {
  proxy.download(
    "asset/export",
    { ...queryParams },
    `asset_${new Date().getTime()}.xlsx`
  )
}

// 重置表单
function resetForm(refName) {
  if (refName === "form" && formRef.value) {
    formRef.value.resetFields()
  } else if (refName === "queryForm" && queryForm.value) {
    queryForm.value.resetFields()
  }
}

const rowClass = ({ row, rowIndex }) => {
  if (row.minThreshold >= row.usableStock) {
    return "warning-row"
  }
}


onMounted(() => {
  getList()
})
</script>
<style lang="scss" scope>
/* 动态闪烁背景色 */
@keyframes warningPulse {

  0%,
  100% {
    background-color: #fff0f0;
    box-shadow: 0 0 5px 0 rgba(255, 0, 0, 0.2);
  }

  50% {
    background-color: #ff6666;
    box-shadow: 0 0 15px 5px rgba(255, 0, 0, 0.6);
  }
}

@keyframes warningShake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-3px);
  }

  50% {
    transform: translateX(3px);
  }

  75% {
    transform: translateX(-3px);
  }
}

.warning-row {
  animation: warningPulse 2s infinite, warningShake 0.5s infinite;
  position: relative;
  font-weight: 600;
  transition: background-color 0.3s ease;
}
</style>
