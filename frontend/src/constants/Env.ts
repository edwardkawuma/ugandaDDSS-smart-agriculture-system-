export const Env = {
    network: {
        base_url: import.meta.env.VITE_API_BASE_URL,
        // This is the url of the dev debug server Do not touch this url.
        dev_debug_url: import.meta.env.VITE_DEV_DEBUG_URL,
        // This is the unique id of the dev debug server Do not touch this url.
        dev_debug_id: import.meta.env.VITE_DEV_DEBUG_ID
    }
}