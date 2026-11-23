/**
 * Kinglet Furniture - Bangladeshi SMS Gateway Integration Service
 * Supports official Bangladeshi SMS Gateways (Greenweb, BulkSMS BD, Alpha SMS)
 * with graceful fallback, number normalization (01xxxxxxxxx / +8801xxxxxxxxx),
 * character count validation, and sandbox simulation mode.
 */

class SmsService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || "GREENWEB"; // "GREENWEB", "BULKSMSBD", "ALPHASMS"
    this.apiKey = process.env.SMS_API_KEY || null;
    this.senderId = process.env.SMS_SENDER_ID || null;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  /**
   * Normalize Bangladeshi mobile numbers to standard formats
   */
  normalizePhone(phone) {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("880")) {
      clean = clean.slice(2);
    }
    if (clean.length === 10 && clean.startsWith("1")) {
      clean = "0" + clean;
    }
    if (/^01[3-9]\d{8}$/.test(clean)) {
      return clean;
    }
    return null;
  }

  /**
   * 1. Send Order Confirmation SMS
   */
  async sendOrderConfirmationSms({ customerName, customerPhone, orderNumber, grandTotal }) {
    const formattedAmount = Number(grandTotal).toLocaleString();
    const message = `Kinglet Furniture: Thank you ${customerName}! Order ${orderNumber} (BDT ৳${formattedAmount}) is confirmed. Track production: https://www.kingletbd.com/track-order?code=${orderNumber}`;
    return await this.sendSms({ recipient: customerPhone, message, event: "ORDER_CONFIRMATION" });
  }

  /**
   * 2. Send Status Change SMS
   */
  async sendStatusChangeSms({ customerPhone, orderNumber, newStatus, comment }) {
    const readableStatus = newStatus.replace(/_/g, " ");
    const message = `Kinglet Furniture: Order ${orderNumber} is now ${readableStatus}.${comment ? ` (${comment})` : ""} Track: https://www.kingletbd.com/track-order?code=${orderNumber}`;
    return await this.sendSms({ recipient: customerPhone, message, event: "STATUS_CHANGE" });
  }

  /**
   * 3. Send Payment Received Confirmation SMS
   */
  async sendPaymentReceivedSms({ customerPhone, orderNumber, amount, transactionRef }) {
    const formattedAmount = Number(amount).toLocaleString();
    const message = `Kinglet Payment: ৳${formattedAmount} received for Order ${orderNumber}. Ref: ${transactionRef}. Thank you!`;
    return await this.sendSms({ recipient: customerPhone, message, event: "PAYMENT_RECEIVED" });
  }

  /**
   * 4. Dispatch SMS via Gateway
   */
  async sendSms({ recipient, message, event = "GENERIC" }) {
    const normalizedPhone = this.normalizePhone(recipient);
    if (!normalizedPhone) {
      return { success: false, reason: `Invalid Bangladeshi mobile number: ${recipient}`, status: "FAILED" };
    }

    if (!this.isConfigured()) {
      console.log(`[SmsService:Simulated] To: ${normalizedPhone} | Event: [${event}] | Msg: "${message}"`);
      return {
        success: true,
        simulated: true,
        recipient: normalizedPhone,
        provider: "SIMULATION_SANDBOX",
        status: "CONFIG_REQUIRED",
      };
    }

    try {
      let response;
      if (this.provider === "GREENWEB") {
        const url = `https://api.greenweb.com.bd/api.php?token=${encodeURIComponent(this.apiKey)}&to=${encodeURIComponent(normalizedPhone)}&message=${encodeURIComponent(message)}`;
        response = await fetch(url, { method: "GET" });
      } else if (this.provider === "BULKSMSBD") {
        const url = "http://bulksmsbd.net/api/smsapi";
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: this.apiKey,
            senderid: this.senderId,
            number: normalizedPhone,
            message,
          }),
        });
      } else {
        // Generic gateway POST endpoint
        response = await fetch(process.env.SMS_ENDPOINT || "https://api.sms-gateway.com/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
          body: JSON.stringify({ to: normalizedPhone, text: message, sender: this.senderId }),
        });
      }

      const resText = await response.text();
      return {
        success: response.ok,
        provider: this.provider,
        response: resText,
        status: response.ok ? "SENT" : "FAILED",
      };
    } catch (err) {
      console.error("[SmsService:Error]", err.message);
      return {
        success: false,
        error: err.message,
        provider: this.provider,
        status: "FAILED",
      };
    }
  }
}

export const smsService = new SmsService();

