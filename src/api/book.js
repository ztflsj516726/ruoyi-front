import request from "@/utils/request";

// 查询图书列表
export function list(params) {
  return request({
    url: "/book/bookList",
    method: "get",
    params,
  });
}

// 新增图书
export function save(data) {
  return request({
    url: "/book/saveBook",
    method: "post",
    data,
  });
}

// 图书详情
export function detail(id) {
  return request({
    url: `/book/detail/${id}`,
    method: "get",
  });
}

// 图书删除
export function deleteBook(data) {
  return request({
    url: `/book/delete`,
    method: "post",
    data
  });
}
