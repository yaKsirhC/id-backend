import cache from "node-cache";
const cacheStore = new cache({
    stdTTL: 180,
    checkperiod: 120
});
const setCache = (key, data)=>{
    cacheStore.set(key, data);
};
const getCache = async (key)=>{
    const value = await cacheStore.get(key);
    if (value === undefined) {
        return {
            success: false,
            doc: null
        };
    }
    return {
        success: true,
        doc: value
    };
};
const deleteCache = (key)=>{
    cacheStore.del(key);
};
export { setCache, getCache, deleteCache };
