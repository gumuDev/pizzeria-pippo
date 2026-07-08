package com.pippo.yapelistener

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.service.notification.NotificationListenerService
import androidx.core.app.NotificationManagerCompat

// Some OEMs (confirmed on HONOR/Magic OS) silently drop the
// NotificationListenerService binding without ever calling
// onListenerDisconnected(), so reacting to that callback alone leaves the app
// deaf until someone manually reopens it or retoggles the permission. This
// nudges the system to rebind on a fixed schedule regardless of whether a
// disconnect was ever noticed, and reschedules itself so the heartbeat keeps
// going even if the app process was fully killed in between.
class RebindAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)) {
            NotificationListenerService.requestRebind(
                ComponentName(context, YapeNotificationListenerService::class.java)
            )
        }
        schedule(context)
    }

    companion object {
        private const val INTERVAL_MILLIS = 15 * 60 * 1000L

        fun schedule(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                Intent(context, RebindAlarmReceiver::class.java),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            // Inexact-but-idle-aware: doesn't require the Android 12+
            // SCHEDULE_EXACT_ALARM permission, and still fires during Doze
            // maintenance windows, which is precise enough for a heartbeat.
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + INTERVAL_MILLIS,
                pendingIntent
            )
        }
    }
}
