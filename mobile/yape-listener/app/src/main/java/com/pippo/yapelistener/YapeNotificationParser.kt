package com.pippo.yapelistener

data class ParsedPayment(val amount: Double, val payerName: String)

// Parses the Yape Bolivia (BCP wallet) "recibiste un yapeo" notification.
// Based on a real sample captured on-device:
//   package: com.bcp.bo.wallet
//   title:   "Recibiste un yapeo"
//   text:    "QR DE GUMUCIO FLORES LUIS WALTER te envió Bs. 0.10"
//
// Only covers payments made via QR (the "QR DE {nombre}" prefix). A direct
// phone-to-phone Yape transfer may use different wording — not covered yet,
// there's no real sample of that variant to design against.
object YapeNotificationParser {
    const val YAPE_PACKAGE_NAME = "com.bcp.bo.wallet"

    private val PAYMENT_TEXT_PATTERN = Regex("""QR DE (.+?) te envi[oó] Bs\.?\s*([\d.,]+)""", RegexOption.IGNORE_CASE)

    fun parse(packageName: String, title: String?, text: String?): ParsedPayment? {
        if (packageName != YAPE_PACKAGE_NAME) return null
        if (title == null || !title.contains("yapeo", ignoreCase = true)) return null
        if (text == null) return null

        val match = PAYMENT_TEXT_PATTERN.find(text) ?: return null
        val payerName = match.groupValues[1].trim()
        val amount = match.groupValues[2].replace(",", "").toDoubleOrNull() ?: return null

        return ParsedPayment(amount = amount, payerName = payerName)
    }
}
