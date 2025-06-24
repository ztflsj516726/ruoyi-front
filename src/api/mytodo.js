import request from "@/utils/request";

// 我的代办列表
export function myToList(params) {
  return request({
    url: `applyTodo/list`,
    method: "get",
    params,
  });
}

// 同意
export function approve(id) {
  return request({
    url: `applyTodo/approve/${id}`,
    method: "post",
  });
}

// 拒绝
export function reject(id) {
  return request({
    url: `applyTodo/reject/${id}`,
    method: "post",
  });
}
