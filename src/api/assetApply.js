import request from '@/utils/request'

// 申请单新增/修改
export function applySave(params) {
  return request({
    url: '/assetApply/applySave',
    method: 'get',
    params
  })
}

// 删除申请单
export function deleteApply(data) {
  return request({
    url: '/assetApply/delete',
    method: 'post',
    data
  })
}

// 申请单详情
export function applyDetail(id) {
  return request({
    url: `/assetApply/detail/${id}`,
    method: 'post',
  })
}

// 物资申请列表
export function applyList(params) {
  return request({
    url: `assetApply/list`,
    method: 'get',
    params
  })
}

