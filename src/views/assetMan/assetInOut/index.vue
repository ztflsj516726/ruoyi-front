<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="100px"
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
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd">
          新增
        </el-button>
      </el-col>

      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="operRecordList">
      <el-table-column label="物资" align="center" prop="assetId">
        <template #default="{ row }">
          <dict-tag :options="assetListOptions" :value="row.assetId" />
        </template>
      </el-table-column>
      <el-table-column label="操作类型" align="center">
        <template #default="{ row }">
          <dict-tag :options="oper_type" :value="row.operType" />
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center">
        <template #default="{ row }">
          <span>{{ ['in', 'back'].includes(row.operType) ? '+' : '-' }} {{ row.operNum }}</span>
        </template>
      </el-table-column>
      <el-table-column label="可用库存" align="center" prop="afterUseableStock" />
      <el-table-column label="操作人/申请人" align="center" prop="createBy" />
      <el-table-column label="操作时间" align="center" prop="createTime" />
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改物资信息对话框 -->
    <el-dialog :title v-model="open" width="700px" append-to-body align-center>
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
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="assetApply">
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { listAsset } from "@/api/asset"
import { OperList, OperSave } from "@/api/assetInOut"

const { proxy } = getCurrentInstance()
const { oper_type, oper_type_add } = proxy.useDict("oper_type", "oper_type_add")


// refs
const queryForm = ref(null)
const formRef = ref(null)

// 状态
const loading = ref(false)
let showSearch = ref(true)
const total = ref(0)
let operRecordList = ref([])
const title = ref("")
const open = ref(false)

// 查询参数
const queryParams = reactive({})

// 表单数据
const form = reactive({
  detailList: [],
  reason: [],
  checkUserId: ''
})

let assetListOptions = ref([])


// 查询表单项配置
const queryFormItems = reactive([
  { label: "操作类型", prop: "operType", type: "el-select", options: oper_type, attrs: { placeholder: "请选择操作类型", clearable: true, style: "width: 200px", filterable: true }, onEnter: true },
  { label: "物资", prop: "assetId", type: "el-select", options: assetListOptions, attrs: { placeholder: "请选择物资", clearable: true, style: "width: 200px", filterable: true }, onEnter: true },
])

// 编辑表单项配置
const formItems = reactive([
  { label: "物资", prop: "assetId", type: "el-select", options: assetListOptions, attrs: { placeholder: "请选择物资", clearable: true, filterable: true } },
  { label: "操作类型", prop: "operType", type: "el-select", options: oper_type_add, attrs: { placeholder: "请选择操作类型", clearable: true, filterable: true } },
  { label: "数量", prop: "operNum", type: "el-input-number", attrs: { placeholder: "请输入数量", min: 0, max: 9999 } },
])

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await OperList(queryParams)
    operRecordList.value = response.data
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
  form.detailList = []
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


const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加入库报废信息"
}


const submitForm = () => {
  if (!formRef.value) return
  loading.value = true
  OperSave(form).then(() => {
    proxy.$modal.msgSuccess("操作成功")
    open.value = false
    getList()
  })
    .catch(() => {
      proxy.$modal.msgError("操作失败")
    })
    .finally(() => {
      loading.value = false
    })
}

// 重置表单
function resetForm(refName) {
  if (refName === "form" && formRef.value) {
    formRef.value.resetFields()
  } else if (refName === "queryForm" && queryForm.value) {
    queryForm.value.resetFields()
  }
}

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
