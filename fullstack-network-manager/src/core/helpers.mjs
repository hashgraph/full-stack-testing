import { MissingArgumentError } from './errors.mjs'

export function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function cloneArray (arr) {
  return JSON.parse(JSON.stringify(arr))
}

/**
 * Utility function to poll
 * @param pollFunc a function that should return true if polling should be stopped
 * @param timeoutFunc an optional function that would be invoked after the timeout
 * @param delay polling delay in milliseconds
 * @param timeout timeout in milliseconds
 */
export function poll (pollFunc, timeoutFunc = null, delay = 100, timeout = 5000) {
  if (!pollFunc) throw new MissingArgumentError('polling function is required')
  if (delay <= 0) throw new MissingArgumentError('polling delay cannot be negative or zero')
  if (timeout <= 0) throw new MissingArgumentError('timeout cannot be negative or zero')

  // poll
  const timerId = setInterval(() => {
    if (pollFunc()) {
      clearInterval(timerId) // stop polling
    }
  }, delay)

  // timeout polling
  setTimeout(() => {
    if (timeoutFunc) {
      timeoutFunc()
    }

    clearInterval(timerId)
  }, timeout)
}
