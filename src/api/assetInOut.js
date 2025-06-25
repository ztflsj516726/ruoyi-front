import request from "@/utils/request";

// 入库报废记录列表
export function OperList(params) {
  return request({
    url: "/assetOper/list",
    method: "get",
    params,
  });
}

// 入库报废
export function OperSave(data) {
  return request({
    url: "/assetOper/save",
    method: "post",
    data,
  });
}
