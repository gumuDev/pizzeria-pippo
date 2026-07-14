package com.pippo.yapelistener

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.NotificationManagerCompat

class MainActivity : AppCompatActivity() {

    private lateinit var backendUrlInput: EditText
    private lateinit var apiKeyInput: EditText
    private lateinit var statusText: TextView
    private lateinit var permissionStatusText: TextView
    private lateinit var batteryStatusText: TextView

    // No-op result handler: the foreground service still starts either way,
    // this only affects whether its status notification is visible to the user.
    private val requestNotificationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestNotificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        backendUrlInput = findViewById(R.id.backendUrlInput)
        apiKeyInput = findViewById(R.id.apiKeyInput)
        statusText = findViewById(R.id.statusText)
        permissionStatusText = findViewById(R.id.permissionStatusText)
        batteryStatusText = findViewById(R.id.batteryStatusText)

        loadSavedConfig()
        RebindAlarmReceiver.schedule(this)

        findViewById<Button>(R.id.saveConfigButton).setOnClickListener { saveConfig() }
        findViewById<Button>(R.id.openNotificationSettingsButton).setOnClickListener {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        findViewById<Button>(R.id.disableBatteryOptimizationButton).setOnClickListener { requestIgnoreBatteryOptimizations() }
        findViewById<Button>(R.id.sendEventButton).setOnClickListener { sendRawTestEvent() }
        findViewById<Button>(R.id.simulateYapeButton).setOnClickListener { simulateRealYapeNotification() }
    }

    override fun onResume() {
        super.onResume()
        updatePermissionStatus()
        updateBatteryStatus()

        // Cheap safety net against the Android platform bug where the
        // NotificationListenerService binding silently drops: every time the
        // user opens the app, ask the system to rebind it. If it's already
        // connected this is a harmless no-op.
        if (NotificationManagerCompat.getEnabledListenerPackages(this).contains(packageName)) {
            NotificationListenerService.requestRebind(
                ComponentName(this, YapeNotificationListenerService::class.java)
            )
        }
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

    // Some OEMs (Xiaomi, Huawei/HONOR, Samsung) aggressively kill background
    // services to save battery, which silently breaks the notification
    // listener even with permission still granted. Exempting the app is safe
    // here — it only listens for one package's notifications and does an
    // occasional tiny HTTP POST, negligible real battery impact.
    private fun updateBatteryStatus() {
        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
        val ignoring = powerManager.isIgnoringBatteryOptimizations(packageName)
        batteryStatusText.text = if (ignoring) {
            "Optimización de batería: desactivada (OK)"
        } else {
            "Optimización de batería: ACTIVA (puede matar el servicio en segundo plano)"
        }
    }

    private fun requestIgnoreBatteryOptimizations() {
        val powerManager = getSystemService(POWER_SERVICE) as PowerManager
        if (powerManager.isIgnoringBatteryOptimizations(packageName)) {
            statusText.text = "Ya está fuera de la optimización de batería."
            return
        }
        startActivity(
            Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:$packageName"))
        )
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
