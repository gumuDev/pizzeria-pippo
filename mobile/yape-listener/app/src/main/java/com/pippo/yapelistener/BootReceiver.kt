package com.pippo.yapelistener

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

// AlarmManager alarms don't survive a reboot on their own, so the rebind
// heartbeat needs to be re-armed once the phone finishes starting up.
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            RebindAlarmReceiver.schedule(context)
        }
    }
}
