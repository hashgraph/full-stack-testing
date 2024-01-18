export function sleep (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function cloneArray (arr) {
  return JSON.parse(JSON.stringify(arr))
}
