<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch">
      <el-form-item label="图书名称" prop="name">
        <el-input v-model="queryParams.name" placeholder="请输入图书名称" clearable style="width: 200px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="作者" prop="author">
        <el-input v-model="queryParams.author" placeholder="请输入作者名称" clearable style="width: 200px"
          @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="借阅状态" clearable style="width: 200px">
          <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="出版时间" prop="author">
        <el-date-picker v-model="publishDateRange" type="daterange" start-placeholder="出版开始时间" value-format="YYYY-MM-DD"
          end-placeholder="出版结束时间" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['system:post:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['system:post:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['system:post:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['system:post:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="booklist" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="图书名称" align="center" prop="name" />
      <el-table-column label="作者" align="center" prop="author" />
      <el-table-column label="出版日期" align="center" prop="publishDate" />
      <el-table-column label="isbn" align="center" prop="isbn" />
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">

      </el-table-column>
      <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['system:post:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['system:post:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改岗位对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="postRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="图书名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入图书名称" />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" placeholder="请输入作者名称" />
        </el-form-item>
        <el-form-item label="isbn" prop="isbn">
          <el-input v-model="form.isbn" placeholder="请输入isbn" />
        </el-form-item>
        <el-form-item label="出版日期" prop="publishDate">
          <el-date-picker v-model="form.publishDate" controls-position="right" :min="0" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">{{ dict.label
            }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Post">
import * as bookApi from "@/api/book.js"
const { proxy } = getCurrentInstance()
const { sys_normal_disable } = proxy.useDict("sys_normal_disable")

const booklist = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

let publishDateRange = ref([])

let form = ref({})
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  author: undefined,
  isbn: undefined,
  name: undefined,
  status: undefined,
  startDate: undefined,
  ennDate: undefined,
})

const rules = {
  name: [{ required: true, message: "图书名称不能为空", trigger: "blur" }],
  author: [{ required: true, message: "作者名称不能为空", trigger: "blur" }],
  publishDate: [{ required: true, message: "出版日期不能为空", trigger: "blur" }],
}


/** 查询岗位列表 */
function getList() {
  loading.value = true
  bookApi.list(queryParams).then(response => {
    booklist.value = response.data
    total.value = response.total
    loading.value = false
  })
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 表单重置 */
function reset() {
  form.value = {
    name: undefined,
    author: undefined,
    isbn: undefined,
    status: "0",
    remark: undefined,
    publishDate: undefined,
  }
  proxy.resetForm("postRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  console.log("publishDateRange", publishDateRange.value);

  if (publishDateRange.value.length !== 0) {
    queryParams.startDate = publishDateRange.value[0]
    queryParams.endDate = publishDateRange.value[1]
  }
  queryParams.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  publishDateRange.value = []
  queryParams.startDate = undefined
  queryParams.endDate = undefined
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加图书"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const id = row.id || ids.value[0]
  bookApi.detail(id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改图书"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["postRef"].validate(valid => {
    if (valid) {
      if (form.value.id != undefined) {
        bookApi.save(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        bookApi.save(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  let temIds = []
  if (row) {
    temIds = [row.id]
  } else {
    temIds = ids.value
  }
  proxy.$modal.confirm('是否确认删除图书为"' + row.name + '"的数据项？').then(function () {
    return bookApi.deleteBook({ ids: temIds })
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download("system/post/export", {
    ...queryParams
  }, `post_${new Date().getTime()}.xlsx`)
}

getList()
</script>
