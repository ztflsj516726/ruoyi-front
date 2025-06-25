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
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="assetList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="申请原因" align="center" prop="reason" />
      <el-table-column label="审批人" align="center">
        <template #default="{ row }">
          <dict-tag :options="userList" :value="row.checkUserId" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="{ row }">
          <dict-tag :options="asset_apply_status" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="部门" align="center" prop="deptName"/>
      <el-table-column label="申请人" align="center" prop="createBy" />
      <el-table-column label="申请时间" align="center" prop="createTime" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="{ row }">
          <el-button link type="primary" icon="Plus" @click="handleSubmit(row)"
          v-if="['draft', 'rejected'].includes(row.status)">提交</el-button>
          <el-button link type="primary" icon="Edit" @click="handleUpdate(row)"
            v-if="['draft', 'rejected'].includes(row.status)">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(row)"
            v-if="row.status === 'draft'">删除</el-button>
        </template>
      </el-table-column>
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
        <el-form-item label="物资列表">
          <el-button type="primary" style="margin-bottom: 10px;" @click="handleAsset.addRow">新增</el-button>
          <el-table border height="300px" :data="form.detailList">
            <el-table-column label="物资" align="center">
              <template #default="{ row }">
                <el-select v-model="row.assetId">
                  <el-option v-for="item in assetListOptions" :key="item.id" :label="item.label" :value="item.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" align="center">
              <template #default="{ row }">
                <el-input-number :min="0" :max="999" v-model="row.count" style="width: 100%;" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80">
              <template #default="{ row, $index }">
                <el-button link type="danger" icon="Delete" @click="handleAsset.deleteRow($index)" />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
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
import * as applyApi from "@/api/assetApply"
import { listAsset } from "@/api/asset"
import { listUser } from "@/api/system/user"

const { proxy } = getCurrentInstance()
const { asset_apply_status } = proxy.useDict("asset_apply_status")


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
const queryParams = reactive({})

// 表单数据
const form = reactive({
  detailList: [],
  reason: [],
  checkUserId: ''
})


let userList = ref([])


// 查询表单项配置
const queryFormItems = reactive([
  { label: "状态", prop: "status", type: "el-select", options: asset_apply_status, attrs: { placeholder: "请选择类别", clearable: true, style: "width: 200px", filterable: true }, onEnter: true },
  { label: "审批人", prop: "checkUserId", type: "el-select", options: userList, attrs: { placeholder: "请选择审批人", clearable: true, style: "width: 200px", filterable: true }, onEnter: true },
])

// 编辑表单项配置
const formItems = reactive([
  { label: "申请原因", prop: "reason", type: "el-input", attrs: { placeholder: "请输入申请原因" } },
  { label: "审批人", prop: "checkUserId", type: "el-select", options: userList, attrs: { placeholder: "请选择审批人", clearable: true, filterable: true }, onEnter: true },
])

// 方法
const getList = async () => {
  loading.value = true
  try {
    const response = await applyApi.applyList(queryParams)
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

const handleSelectionChange = (selection) => {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = "添加申请单信息"
}

const handleSubmit = (row) => {
  proxy.$modal.confirm('是否确认该申请单？')
    .then(() => applyApi.submitApply(row.id))
    .then(() => {
      getList()
      proxy.$modal.msgSuccess("提交成功")
    })
}

const handleUpdate = (row) => {
  reset()
  const id = row?.id || ids.value
  applyApi.applyDetail(id).then((response) => {
    Object.assign(form, response.data)
    open.value = true
    title.value = "修改申请单信息"
  })
}

const submitForm = () => {
  console.log("form", form);
  if (!formRef.value) return
  loading.value = true
  applyApi.applySave(form).then(() => {
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

const handleDelete = (row) => {
  const deleteIds = row?.id || ids.value
  proxy.$modal.confirm('是否确认删除物资信息编号为"' + deleteIds + '"的数据项？')
    .then(() => applyApi.deleteApply(deleteIds))
    .then(() => {
      getList()
      proxy.$modal.msgSuccess("删除成功")
    })
    .catch(() => { })
}

// 重置表单
function resetForm(refName) {
  if (refName === "form" && formRef.value) {
    formRef.value.resetFields()
  } else if (refName === "queryForm" && queryForm.value) {
    queryForm.value.resetFields()
  }
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
const getUserList = () => {
  listUser().then(res => {
    userList.value = res.data.map(item => {
      return {
        label: item.nickName,
        value: item.userId
      }
    })
  })
}

const handleAsset = {
  addRow: () => {
    form.detailList.push({ count: 0 })
  },
  deleteRow: (index) => {
    form.detailList.splice(index, 1)
  }
}

onMounted(() => {
  getList()
  getAssetList()
  getUserList()
})
</script>
