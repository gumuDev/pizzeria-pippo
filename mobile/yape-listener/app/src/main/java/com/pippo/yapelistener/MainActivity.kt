package com.pippo.yapelistener

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var backendUrlInput: EditText
    private lateinit var apiKeyInput: EditText
    private lateinit var statusText: TextView
    private lateinit var permissionStatusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        backendUrlInput = findViewById(R.id.backendUrlInput)
        apiKeyInput = findViewById(R.id.apiKeyInput)
        statusText = findViewById(R.id.statusText)
        permissionStatusText = findViewById(R.id.permissionStatusText)

        loadSavedConfig()

        findViewById<Button>(R.id.saveConfigButton).setOnClickListener { saveConfig() }
        findViewById<Button>(R.id.openNotificationSettingsButton).setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        findViewById<Button>(R.id.sendEventButton).setOnClickListener { sendRawTestEvent() }
        findViewById<Button>(R.id.simulateYapeButton).setOnClickListener { simulateRealYapeNotification() }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatus()
    }

    private fun loadSavedConfig() {
        val savedUrl = BackendPrefs.getBackendUrl(this)
        if (savedUrl.isNotEmpty()) backendUrlInput.setText(savedUrl)
        apiKeyInput.setText(BackendPrefs.getApiKey(this))
    }

    private fun saveConfig() {
        BackendPrefs.save(this, backendUrlInput.text.toString().trim(), apiKeyInput.text.toString().trim())
        statusText.text = "Configuración guardada."
    }

    private fun updatePermissionStatus() {
        val enabledListeners = NotificationManagerCompat.getEnabledListenerPackages(this)
        val granted = enabledListeners.contains(packageName)
        permissionStatusText.text = if (granted) {
            "Acceso a notificaciones: concedido"
        } else {
            "Acceso a notificaciones: NO concedido"
        }
    }

    private fun sendRawTestEvent() {
        statusText.text = "Enviando..."
        PaymentNotificationSender.send(
            context = this,
            amount = 1.0,
            payerName = "Prueba Conectividad",
            rawText = "Evento de prueba enviado desde la app Android",
        ) { _, message -> runOnUiThread { statusText.text = message } }
    }

    // Feeds a real captured Yape notification through the same parser the
    // background listener uses — validates the parsing + sending logic
    // without needing to wait for (or pay for) a real transaction.
    private fun simulateRealYapeNotification() {
        val sampleText = "QR DE GUMUCIO FLORES LUIS WALTER te envió Bs. 0.10"
        val parsed = YapeNotificationParser.parse(
            packageName = YapeNotificationParser.YAPE_PACKAGE_NAME,
            title = "Recibiste un yapeo",
            text = sampleText,
        )

        if (parsed == null) {
            statusText.text = "El parser no reconoció el texto de ejemplo."
            return
        }

        statusText.text = "Parseado: Bs. ${parsed.amount} de \"${parsed.payerName}\" — enviando..."
        PaymentNotificationSender.send(
            context = this,
            amount = parsed.amount,
            payerName = parsed.payerName,
            rawText = sampleText,
        ) { _, message -> runOnUiThread { statusText.text = message } }
    }
}
