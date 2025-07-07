import request from "@/utils/request";

// 出库申请单新增/修改
export function applyOutSave(data) {
  return request({
    url: "/assetOutApply/applySave",
    method: "post",
    data,
  });
}

// 删除出库申请单
export function deleteOutApply(data) {
  let dataParams = [];
  if (!Array.isArray(data)) {
    dataParams = [data];
  } else {
    dataParams = data;
  }
  return request({
    url: "/assetOutApply/delete",
    method: "post",
    data: dataParams,
  });
}

// 出库申请单详情
export function applyOutDetail(id) {
  return request({
    url: `/assetOutApply/detail/${id}`,
    method: "get",
  });
}

// 物资申请列表
export function applyOutList(params) {
  return request({
    url: `assetOutApply/list`,
    method: "get",
    params,
  });
}

// 物资出库申请单提交
export function submitOutApply(id) {
  return request({
    url: `assetOutApply/submit/${id}`,
    method: "post",
  });
}

// 物资出库申请单归还
export function backOutApply(id) {
  return request({
    url: `assetOutApply/back/${id}`,
    method: "post",
  });
}
