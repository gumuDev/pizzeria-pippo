package com.pippo.yapelistener

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class YapeNotificationListenerService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val extras = sbn.notification.extras
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
        val text = bigText ?: extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()

        val parsed = YapeNotificationParser.parse(sbn.packageName, title, text) ?: return

        Log.i(TAG, "Pago de Yape detectado: Bs. ${parsed.amount} de \"${parsed.payerName}\"")
        PaymentNotificationSender.send(
            context = applicationContext,
            amount = parsed.amount,
            payerName = parsed.payerName,
            rawText = text ?: "",
        )
    }

    companion object {
        private const val TAG = "YapeNotificationListener"
    }
}
