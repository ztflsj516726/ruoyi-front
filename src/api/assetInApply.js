import request from "@/utils/request";

// 入库申请单新增/修改
export function applyInSave(data) {
  return request({
    url: "/assetInApply/applySave",
    method: "post",
    data,
  });
}

// 入库申请单通过
export function applyInApprove(id) {
  return request({
    url: `/assetInApply/approve/${id}`,
    method: "post",
  });
}

// 入库申请单删除
export function applyInDelete(data) {
  let dataParams = [];
  if (!Array.isArray(data)) {
    dataParams = [data];
  } else {
    dataParams = data;
  }
  return request({
    url: `/assetInApply/delete`,
    method: "post",
    data:dataParams
  });
}

// 入库申请单拒绝
export function applyInReject(id) {
  return request({
    url: `/assetInApply/reject/${id}`,
    method: "post",
  });
}

// 入库申请单提交
export function applyInSubmit(id) {
  return request({
    url: `/assetInApply/submit/${id}`,
    method: "post",
  });
}

// 入库申请单详情
export function applyInDetail(id) {
  return request({
    url: `/assetInApply/detail/${id}`,
    method: "get",
  });
}

// 入库申请单列表
export function applyInList(params) {
  return request({
    url: `/assetInApply/list`,
    method: "get",
    params
  });
}

