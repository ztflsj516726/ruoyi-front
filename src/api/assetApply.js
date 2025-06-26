import request from "@/utils/request";

// 申请单新增/修改
export function applySave(data) {
  return request({
    url: "/assetApply/applySave",
    method: "post",
    data,
  });
}

// 删除申请单
export function deleteApply(data) {
  let dataParams = [];
  if (!Array.isArray(data)) {
    dataParams = [data];
  } else {
    dataParams = data;
  }
  return request({
    url: "/assetApply/delete",
    method: "post",
    data: dataParams,
  });
}

// 申请单详情
export function applyDetail(id) {
  return request({
    url: `/assetApply/detail/${id}`,
    method: "get",
  });
}

// 物资申请列表
export function applyList(params) {
  return request({
    url: `assetApply/list`,
    method: "get",
    params,
  });
}

// 物资申请单提交
export function submitApply(id) {
  return request({
    url: `assetApply/submit/${id}`,
    method: "post",
  });
}

// 物资申请单归还
export function backApply(id) {
  return request({
    url: `assetApply/back/${id}`,
    method: "post",
  });
}
