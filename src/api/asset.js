import request from '@/utils/request'

// 查询物资信息列表
export function listAsset(query) {
  return request({
    url: '/asset/list',
    method: 'get',
    params: query
  })
}

// 查询物资信息详细
export function getAsset(id) {
  return request({
    url: '/asset/' + id,
    method: 'get'
  })
}

// 新增物资信息
export function addAsset(data) {
  return request({
    url: '/asset',
    method: 'post',
    data: data
  })
}

// 修改物资信息
export function updateAsset(data) {
  return request({
    url: '/asset',
    method: 'put',
    data: data
  })
}

// 删除物资信息
export function delAsset(id) {
  return request({
    url: '/asset/' + id,
    method: 'delete'
  })
}
