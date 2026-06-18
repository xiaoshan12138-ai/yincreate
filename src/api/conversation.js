import request from '../utils/request'

/**
 * 创建对话
 * POST /api/v1/conversations
 * @param {Object} params - { title?: string }
 * @returns {Promise} ConversationResponse
 */
export function createConversationApi(params = {}) {
  return request.post('/api/v1/conversations', params)
}

/**
 * 列出我可见的对话
 * GET /api/v1/conversations
 * @param {Object} params - { limit?: number, offset?: number }
 * @returns {Promise} { total, items: ConversationResponse[] }
 */
export function listConversationsApi(params = {}) {
  return request.get('/api/v1/conversations', { params })
}

/**
 * 获取对话详情
 * GET /api/v1/conversations/{id}
 * @param {string} conversationId
 * @returns {Promise} ConversationResponse
 */
export function getConversationApi(conversationId) {
  return request.get(`/api/v1/conversations/${conversationId}`)
}

/**
 * 修改对话（重命名 / 归档）
 * PATCH /api/v1/conversations/{id}
 * @param {string} conversationId
 * @param {Object} params - { title?: string, status?: 'active'|'archived' }
 * @returns {Promise} ConversationResponse
 */
export function updateConversationApi(conversationId, params) {
  return request.patch(`/api/v1/conversations/${conversationId}`, params)
}

/**
 * 获取对话消息列表
 * GET /api/v1/conversations/{id}/messages
 * @param {string} conversationId
 * @param {Object} params - { limit?: number, offset?: number }
 * @returns {Promise} { total, items: MessageResponse[] }
 */
export function listMessagesApi(conversationId, params = {}) {
  return request.get(`/api/v1/conversations/${conversationId}/messages`, { params })
}

/**
 * 追加一条文本消息
 * POST /api/v1/conversations/{id}/messages
 * @param {string} conversationId
 * @param {Object} params - { content: string, role?: 'user'|'assistant'|'system' }
 * @returns {Promise} MessageResponse
 */
export function postMessageApi(conversationId, params) {
  return request.post(`/api/v1/conversations/${conversationId}/messages`, params)
}
