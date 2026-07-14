package com.pippo.yapelistener

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ComponentName
import android.content.pm.ServiceInfo
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat

class YapeNotificationListenerService : NotificationListenerService() {

    // Promotes this service to foreground as soon as the system binds it —
    // a plain background listener is fair game for OEM battery managers
    // (Xiaomi/Huawei-HONOR/Samsung) to kill; a foreground service with a
    // visible, permanent notification is much harder for them to touch,
    // and the goal is this app running reliably across many phone brands.
    override fun onListenerConnected() {
        super.onListenerConnected()
        startForegroundStatusNotification()
    }

    // Android has a long-standing platform bug where the system silently
    // drops the binding to a NotificationListenerService (independent of any
    // OEM battery manager, and even with the permission still shown as
    // "granted") — this is the official self-healing hook: ask the system to
    // rebind immediately instead of waiting for the user to notice and
    // manually toggle the permission off/on.
    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        FileLogger.log(applicationContext, TAG, "Listener desconectado por el sistema — solicitando reconexión")
        requestRebind(ComponentName(applicationContext, YapeNotificationListenerService::class.java))
    }

    private fun startForegroundStatusNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(
            NotificationChannel(STATUS_CHANNEL_ID, "Yape Listener — estado", NotificationManager.IMPORTANCE_MIN)
        )

        val notification = NotificationCompat.Builder(this, STATUS_CHANNEL_ID)
            .setContentTitle("Yape Listener activo")
            .setContentText("Escuchando pagos de Yape en segundo plano")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(STATUS_NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(STATUS_NOTIFICATION_ID, notification)
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        // Filtered before extracting extras/logging so this doesn't write a line
        // for every notification posted system-wide, only Yape's.
        if (sbn.packageName != YapeNotificationParser.YAPE_PACKAGE_NAME) return

        val extras = sbn.notification.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
        val text = bigText ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()

        FileLogger.log(applicationContext, TAG, "Notificación de Yape recibida — title=\"$title\" text=\"$text\"")

        val parsed = YapeNotificationParser.parse(sbn.packageName, title, text)
        if (parsed == null) {
            FileLogger.log(applicationContext, TAG, "El parser no reconoció el texto — descartada, no se envía nada")
            return
        }

        Log.i(TAG, "Pago de Yape detectado: Bs. ${parsed.amount} de \"${parsed.payerName}\"")
        FileLogger.log(applicationContext, TAG, "Parseado OK: Bs. ${parsed.amount} de \"${parsed.payerName}\" — enviando al backend")
        PaymentNotificationSender.send(
            context = applicationContext,
            amount = parsed.amount,
            payerName = parsed.payerName,
            rawText = text ?: "",
        )
    }

    companion object {
        private const val TAG = "YapeNotificationListener"
        private const val STATUS_CHANNEL_ID = "yape_listener_status"
        private const val STATUS_NOTIFICATION_ID = 1001
    }
}
