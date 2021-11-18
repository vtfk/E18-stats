const addOperation = require('./add-operation')

module.exports = options => {
  if (!options.operations) throw new Error('Missing required "options.operations" array')
  if (!Array.isArray(options.operations)) throw new Error('Required "options.operations" must be an array')

  let task = {
    system: options.system, // required ; string
    method: options.method, // required ; string
    operations: options.operations.map(addOperation), // required ; array of operation
    createdTimestamp: options.createdTimestamp || new Date().toISOString(),
    modifiedTimestamp: options.modifiedTimestamp || new Date().toISOString()
  }

  if (options.jobId) { // optional ; string
    task = {
      jobId: options.jobId,
      ...task
    }
  }
  if (options.status) { // optional ; string
    const { jobId, system, method, ...rest } = task
    task = {
      jobId,
      system,
      method,
      status: options.status,
      ...rest
    }
  }
  if (options.retries) { // optional ; number
    const { jobId, system, method, status, ...rest } = task
    task = {
      jobId,
      system,
      method,
      status,
      retries: options.retries,
      ...rest
    }
  }
  if (options.data) { // optional ; object
    const { jobId, system, method, status, retries, ...rest } = task
    task = {
      jobId,
      system,
      method,
      status: options.status,
      retries,
      data: options.data,
      ...rest
    }
  }
  if (options.dependencyTag) { // optional ; string
    const { jobId, system, method, status, retries, data, ...rest } = task
    task = {
      jobId,
      system,
      method,
      status: options.status,
      retries,
      data,
      dependencyTag: options.dependencyTag,
      ...rest
    }
  }
  if (options.dependencies) { // optional ; array of string
    const { jobId, system, method, status, retries, data, dependencyTag, ...rest } = task
    task = {
      jobId,
      system,
      method,
      status: options.status,
      retries,
      data,
      dependencyTag,
      dependencies: options.dependencies,
      ...rest
    }
  }

  return task
}