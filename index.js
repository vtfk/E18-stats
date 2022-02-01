const axios = require('axios').default
const { logger } = require('@vtfk/logger')

const hasData = obj => {
  if (obj === null || obj === undefined) return false
  if (typeof obj === 'boolean') return true
  if (Array.isArray(obj) && obj.length === 0) return false
  if (typeof obj === 'object' && Object.getOwnPropertyNames(obj).filter(prop => prop !== 'length').length === 0) return false
  if (typeof obj !== 'number' && typeof obj !== 'string' && !Array.isArray(obj) && typeof obj !== 'object') return false
  if (typeof obj === 'string' && obj.length === 0) return false

  return true
}

const getInfo = options => {
  if (!hasData(options)) return {}

  if (options?.body?.e18) return options.body.e18
  else if (options?.headers?.e18JobId) {
    const { e18JobId: jobId, e18TaskId: taskId, e18Task: task } = options?.headers
    return {
      jobId,
      taskId,
      ...task
    }
  }

  return {}
}

const create = async (options, result, context) => {
  const { E18_URL: URL, E18_KEY: KEY, E18_SYSTEM: SYSTEM } = process.env
  let { jobId, taskId, ...task } = getInfo(options)

  if (!jobId) {
    logger('info', ['e18-stats', 'missing data for E18'])
    return { error: 'missing data for E18' }
  }

  const headers = {
    headers: {
      'X-API-KEY': KEY
    }
  }

  if (jobId && !taskId) {
    if (!task || Object.getOwnPropertyNames(task).length === 0) {
      logger('error', ['e18-stats', jobId, 'missing task metadata'])
      return {
        jobId,
        error: 'missing task metadata'
      }
    }
    try {
      task.system = SYSTEM || task.system
      if (!task.system) throw new Error('missing "system" property')

      task.method = context?.executionContext?.functionName?.toLowerCase() || task.method
      if (!task.method) throw new Error('missing "method" property')

      const { data } = await axios.post(`${URL}/jobs/${jobId}/tasks`, task, headers)
      taskId = data._id
      logger('info', ['e18-stats', jobId, 'create task', 'successfull', taskId])
    } catch (error) {
      const statusCode = error.response?.data?.statusCode || error.response?.status || 400
      const message = error.response?.data?.message || error.response?.message || error.message
      logger('error', ['e18-stats', jobId, 'create task', 'failed', statusCode, message])
      return {
        jobId,
        error: 'create task failed',
        statusCode,
        message
      }
    }
  }

  try {
    if (!result || !result.status) {
      logger('error', ['e18-stats', jobId, taskId, 'missing result status'])
      return {
        jobId,
        taskId,
        error: 'missing result status'
      }
    }
    const payload = {
      status: result.status,
      message: result.message || result.error?.message || result.error?.body?.message || ''
    }
    if (result.status === 'failed') {
      if (hasData(result.error)) {
        if (typeof result.error === 'object') {
          payload.error = JSON.parse(JSON.stringify(result.error, Object.getOwnPropertyNames(result.error)))
        } else {
          payload.error = result.error
        }
      }
    } else {
      if (hasData(result.data)) {
        payload.data = result.data
      }
    }

    const { data } = await axios.post(`${URL}/jobs/${jobId}/tasks/${taskId}/operations`, payload, headers)
    logger('info', ['e18-stats', jobId, taskId, 'create operation', 'successfull', data._id])
    return {
      jobId,
      taskId,
      task,
      data
    }
  } catch (error) {
    const { statusCode, message } = error.response.data
    logger('error', ['e18-stats', jobId, taskId, 'create operation', 'failed', statusCode || 400, message])
    return {
      jobId,
      taskId,
      error: 'create operation failed',
      statusCode,
      message
    }
  }
}

module.exports = {
  create
}
