package com.pippo.yapelistener

import android.content.Context
import android.util.Log
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException

// Shared by the real NotificationListenerService and the manual test buttons
// in MainActivity, so both paths report to the backend the same way.
object PaymentNotificationSender {
    private const val TAG = "PaymentNotificationSender"
    private val httpClient = OkHttpClient()

    fun send(context: Context, amount: Double, payerName: String, rawText: String, onResult: ((success: Boolean, message: String) -> Unit)? = null) {
        val backendUrl = BackendPrefs.getBackendUrl(context)
        val apiKey = BackendPrefs.getApiKey(context)

        if (backendUrl.isEmpty() || apiKey.isEmpty()) {
            val message = "Falta configurar la URL del backend o el API key"
            Log.w(TAG, message)
            onResult?.invoke(false, message)
            return
        }

        val body = JSONObject().apply {
            put("amount", amount)
            put("payer_name", payerName)
            put("raw_text", rawText)
        }.toString().toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$backendUrl/payment-validation/notifications")
            .header("X-Device-Api-Key", apiKey)
            .post(body)
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Log.e(TAG, "Error de red enviando notificación: ${e.message}")
                onResult?.invoke(false, "Error de red: ${e.message}")
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                Log.i(TAG, "Notificación enviada (${response.code}): $responseBody")
                onResult?.invoke(response.isSuccessful, "Respuesta (${response.code}): $responseBody")
            }
        })
    }
}
