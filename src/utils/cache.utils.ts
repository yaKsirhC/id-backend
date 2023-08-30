import cache from 'node-cache'
const cacheStore = new cache({ stdTTL: 180, checkperiod: 120 })

const setCache = (key: string, data: any) => {
    cacheStore.set(key, data)
}

const getCache = async (key: string): Promise<{ success: boolean, doc: any }> => {
    const value = await cacheStore.get(key)
    if (value === undefined) {
        return {
            success: false,
            doc: null
        }
    }
    return {
        success: true,
        doc: value
    }
}

const deleteCache = (key: string) => {
    cacheStore.del(key)
}

export { setCache, getCache, deleteCache }