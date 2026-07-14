package com.pippo.yapelistener

import android.content.Context

// Persists the backend URL + device API key so the background notification
// listener (which has no screen of its own) can read them without the app
// being open in the foreground.
object BackendPrefs {
    private const val PREFS_NAME = "backend_prefs"
    private const val KEY_URL = "backend_url"
    private const val KEY_API_KEY = "api_key"

    fun save(context: Context, backendUrl: String, apiKey: String) {
        prefs(context).edit()
            .putString(KEY_URL, backendUrl)
            .putString(KEY_API_KEY, apiKey)
            .apply()
    }

    fun getBackendUrl(context: Context): String =
        prefs(context).getString(KEY_URL, "") ?: ""

    fun getApiKey(context: Context): String =
        prefs(context).getString(KEY_API_KEY, "") ?: ""

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
}
