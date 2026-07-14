package com.pippo.yapelistener

import android.content.Context
import android.util.Log
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

// Persists debug lines to a per-day file under app-specific external storage
// (Android/data/com.pippo.yapelistener/files/logs/), so real-world payment
// issues can be inspected later via USB file browsing — Logcat alone only
// works live, connected, at the moment the event happens.
object FileLogger {
    private val dayFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.US)

    fun log(context: Context, tag: String, message: String) {
        try {
            val dir = context.getExternalFilesDir("logs") ?: return
            if (!dir.exists()) dir.mkdirs()
            val file = File(dir, "yape-listener-${dayFormat.format(Date())}.log")
            file.appendText("${timeFormat.format(Date())} [$tag] $message\n")
        } catch (e: Exception) {
            Log.e("FileLogger", "Failed to write log file", e)
        }
    }
}
