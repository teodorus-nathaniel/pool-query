export interface PoolQueryConfig<Param, SingleReturn> {
  multiCall: (params: Param[]) => Promise<SingleReturn[]>
  resultMapper?: {
    resultToKey: (result: SingleReturn) => string
    paramToKey: (param: Param) => string
  }
  singleCall?: (params: Param) => Promise<SingleReturn>
  waitTime?: number
}

export default function poolQuery<Param, SingleReturn>(
  config: PoolQueryConfig<Param, SingleReturn>
): (param: Param) => Promise<SingleReturn | undefined> {
  const { multiCall, singleCall, waitTime = 250, resultMapper } = config
  let queryPool: Param[] = []
  let timeout: number | undefined

  type BatchData =
    | SingleReturn[]
    | {
        [key: string]: SingleReturn
      }

  let batchResolver: (value: BatchData | PromiseLike<BatchData>) => void
  const batchPromise = new Promise<BatchData>((resolve) => {
    batchResolver = resolve
  })

  const later = async function () {
    timeout = undefined
    let response: Promise<SingleReturn[]>
    if (singleCall && queryPool.length === 1) {
      const queries = queryPool.map((singleParam) => {
        return singleCall(singleParam)
      })
      response = Promise.all(queries)
    } else {
      response = multiCall(queryPool)
    }
    const resultArray = await response

    let result: { [key: string]: SingleReturn } | SingleReturn[] = resultArray
    if (resultMapper) {
      const resultMap: { [key: string]: SingleReturn } = {}
      resultArray.forEach((singleResult) => {
        const key = resultMapper.resultToKey(singleResult)
        resultMap[key] = singleResult
      })
      result = resultMap
    }
    queryPool = []
    batchResolver(result)
  }

  return async function executedFunction(
    param: Param
  ): Promise<SingleReturn | undefined> {
    const currentIndex = queryPool.length
    queryPool.push(param)
    window.clearTimeout(timeout)
    timeout = window.setTimeout(later, waitTime)

    const result = await batchPromise
    if (Array.isArray(result)) {
      return result[currentIndex]
    } else {
      const key = resultMapper?.paramToKey(param)
      return key ? result[key] : undefined
    }
  }
}
