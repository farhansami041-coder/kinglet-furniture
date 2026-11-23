import prisma from "../db/prisma.js";
import { emailService } from "./email.service.js";
import { smsService } from "./sms.service.js";

/**
 * Kinglet Furniture Notification Service
 * Handles Customer & Admin DB Notifications, Order Confirmations, Status Changes,
 * Payment Submissions/Verifications, Low-Stock Alerts, and Refund Notices.
 */

export class NotificationService {
  /**
   * Internal helper to record notification attempt in database
   */
  async recordLog({
    recipient,
    audience = "CUSTOMER",
    channel,
    event,
    title,
    subject,
    body,
    status,
    provider,
    referenceId,
    orderId,
    isRead = false,
    metadata,
  }) {
    try {
      return await prisma.notificationLog.create({
        data: {
          recipient,
          audience,
          channel,
          event,
          title: title || subject || null,
          subject: subject || null,
          body,
          status,
          provider: provider || "SYSTEM",
          referenceId: referenceId ? String(referenceId) : null,
          orderId: orderId ? String(orderId) : null,
          isRead: Boolean(isRead),
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (err) {
      console.error("Failed to write NotificationLog:", err);
      return null;
    }
  }

  /**
   * Helper to create an internal Admin dashboard notification
   */
  async notifyAdmin({ event, title, body, orderId, referenceId, metadata }) {
    return this.recordLog({
      recipient: "ADMIN",
      audience: "ADMIN",
      channel: "INTERNAL_ALERT",
      event,
      title,
      subject: title,
      body,
      status: "SENT",
      provider: "SYSTEM_ALERTER",
      orderId: orderId || null,
      referenceId: referenceId || orderId || null,
      isRead: false,
      metadata,
    });
  }

  /**
   * 1. Order Confirmation / Placed Notification (SMS + Email + Admin Alert)
   */
  async notifyOrderConfirmation({ order }) {
    const recipientPhone = order.customerPhone;
    const recipientEmail = order.customerEmail;
    const orderNumber = order.orderNumber;
    const amount = Number(order.grandTotal).toLocaleString();

    const smsResult = await smsService.sendOrderConfirmationSms({
      customerName: order.customerName,
      customerPhone: recipientPhone,
      orderNumber,
      grandTotal: order.grandTotal,
    });

    const smsBody = `Kinglet Furniture: Thank you ${order.customerName}! Your order ${orderNumber} (BDT ৳${amount}) is placed. Track live: https://www.kingletbd.com/track-order?inv=${orderNumber}`;

    await this.recordLog({
      recipient: recipientPhone,
      audience: "CUSTOMER",
      channel: "SMS",
      event: "ORDER_PLACED",
      title: `Order Placed: ${orderNumber}`,
      body: smsBody,
      status: smsResult.status || (smsResult.success ? "SENT" : "FAILED"),
      provider: smsResult.provider || "SMS_DISPATCHER",
      referenceId: order.id,
      orderId: order.id,
      metadata: { orderNumber, grandTotal: order.grandTotal, customerPhone: recipientPhone },
    });

    // Notify Admin Dashboard of new order
    await this.notifyAdmin({
      event: "NEW_ORDER_RECEIVED",
      title: `New Order ${orderNumber} (৳${amount})`,
      body: `${order.customerName} (${recipientPhone}) placed a ${order.paymentMethod} order for ৳${amount}.`,
      orderId: order.id,
      referenceId: orderNumber,
      metadata: {
        orderNumber,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        grandTotal: order.grandTotal,
      },
    });

    if (recipientEmail) {
      const emailResult = await emailService.sendOrderConfirmationEmail({ order });
      const emailSubject = `Order Received: ${orderNumber} | Kinglet Handcrafted Furniture`;
      const emailBody = `Dear ${order.customerName},\n\nYour order #${orderNumber} has been received. Grand Total: BDT ৳${amount}.\n\nInvoice Code: ${order.invoiceCode}\nDelivery Address: ${order.shippingAddress}, ${order.district}\n\nTrack progress anytime at: https://www.kingletbd.com/track-order?inv=${orderNumber}`;

      await this.recordLog({
        recipient: recipientEmail,
        audience: "CUSTOMER",
        channel: "EMAIL",
        event: "ORDER_CONFIRMATION",
        title: emailSubject,
        subject: emailSubject,
        body: emailBody,
        status: emailResult.status || (emailResult.success ? "SENT" : "FAILED"),
        provider: emailService.isConfigured() ? "SMTP" : "EMAIL_SIMULATOR",
        referenceId: order.id,
        orderId: order.id,
        metadata: { orderNumber, messageId: emailResult.messageId },
      });
    }
  }

  /**
   * 2. Order Status Change Notification
   */
  async notifyOrderStatusChange({ order, newStatus, comment }) {
    const orderNumber = order.orderNumber;
    const readableStatus = String(newStatus).replace(/_/g, " ");

    const smsResult = await smsService.sendStatusChangeSms({
      customerPhone: order.customerPhone,
      orderNumber,
      newStatus,
      comment,
    });

    const smsBody = `Kinglet Update: Order ${orderNumber} is now ${readableStatus}.${comment ? ` (${comment})` : ""} Track: https://www.kingletbd.com/track-order?inv=${orderNumber}`;

    await this.recordLog({
      recipient: order.customerPhone,
      audience: "CUSTOMER",
      channel: "SMS",
      event: "STATUS_CHANGE",
      title: `Order ${orderNumber}: ${readableStatus}`,
      body: smsBody,
      status: smsResult.status || (smsResult.success ? "SENT" : "FAILED"),
      provider: smsResult.provider || "SMS_DISPATCHER",
      referenceId: order.id,
      orderId: order.id,
      metadata: { orderNumber, newStatus },
    });

    if (order.customerEmail) {
      const emailResult = await emailService.sendOrderStatusEmail({ order, newStatus, comment });
      await this.recordLog({
        recipient: order.customerEmail,
        audience: "CUSTOMER",
        channel: "EMAIL",
        event: "STATUS_CHANGE",
        title: `Update on Order ${orderNumber}: ${readableStatus}`,
        subject: `Update on Order ${orderNumber}: ${readableStatus}`,
        body: `Order ${orderNumber} transitioned to ${readableStatus}. ${comment || ""}`,
        status: emailResult.status || (emailResult.success ? "SENT" : "FAILED"),
        provider: emailService.isConfigured() ? "SMTP" : "EMAIL_SIMULATOR",
        referenceId: order.id,
        orderId: order.id,
        metadata: { orderNumber, newStatus },
      });
    }
  }

  /**
   * 3. Payment Status Received / Verified / Rejected Notification
   */
  async notifyPaymentStatusUpdate({ order, transaction, event = "PAYMENT_RECEIVED", customMessage }) {
    const amount = Number(transaction.amount || order.grandTotal).toLocaleString();
    const smsResult = await smsService.sendPaymentReceivedSms({
      customerPhone: order.customerPhone,
      orderNumber: order.orderNumber,
      amount,
      transactionRef: transaction.transactionRef,
    });

    const smsBody =
      customMessage ||
      `Kinglet Payment: BDT ৳${amount} verified for Order ${order.orderNumber}. Ref: ${transaction.transactionRef}. Thank you!`;

    await this.recordLog({
      recipient: order.customerPhone,
      audience: "CUSTOMER",
      channel: "SMS",
      event,
      title: `Payment ${event === "PAYMENT_REJECTED" ? "Rejected" : "Verified"}: ${order.orderNumber}`,
      body: smsBody,
      status: smsResult.status || (smsResult.success ? "SENT" : "FAILED"),
      provider: smsResult.provider || "SMS_DISPATCHER",
      referenceId: order.id,
      orderId: order.id,
      metadata: { transactionRef: transaction.transactionRef, amount, event },
    });
  }

  /**
   * 4. Manual Payment Submission Alert (Admin Notification)
   */
  async notifyManualPaymentSubmitted({ order, transaction }) {
    const amount = Number(transaction.amount || 0).toLocaleString();
    await this.notifyAdmin({
      event: "PAYMENT_VERIFICATION_REQUIRED",
      title: `Verify Payment: ${order.orderNumber} (৳${amount})`,
      body: `${order.customerName} submitted ${transaction.paymentChannel || transaction.gateway} TrxID "${transaction.manualTrxId || transaction.transactionRef}" for ৳${amount}.`,
      orderId: order.id,
      referenceId: transaction.transactionRef,
      metadata: {
        orderNumber: order.orderNumber,
        trxId: transaction.manualTrxId || transaction.transactionRef,
        channel: transaction.paymentChannel || transaction.gateway,
        amount: transaction.amount,
      },
    });
  }

  /**
   * 5. Cancellation & Refund Notification
   */
  async notifyRefundUpdate({ order, refundAmount, reason }) {
    const amount = Number(refundAmount).toLocaleString();
    const smsBody = `Kinglet Refund Notice: BDT ৳${amount} refund processed for Order ${order.orderNumber}. Reason: ${reason || "Order cancellation"}.`;

    const smsResult = await smsService.sendSms({
      recipient: order.customerPhone,
      message: smsBody,
      event: "REFUND_UPDATE",
    });

    await this.recordLog({
      recipient: order.customerPhone,
      audience: "CUSTOMER",
      channel: "SMS",
      event: "REFUND_UPDATE",
      title: `Refund Processed: ${order.orderNumber}`,
      body: smsBody,
      status: smsResult.status || (smsResult.success ? "SENT" : "FAILED"),
      provider: smsResult.provider || "SMS_DISPATCHER",
      referenceId: order.id,
      orderId: order.id,
      metadata: { refundAmount, reason },
    });
  }

  /**
   * 6. Low-Stock Alert for Administrators
   */
  async notifyLowStockAlert({ product, currentStock }) {
    const stockNum = currentStock ?? 0;
    const body = `CRITICAL INVENTORY ALERT: Product "${product.name}" (SKU: ${product.sku}) stock has reached ${stockNum} unit(s).`;

    await this.notifyAdmin({
      event: "LOW_STOCK_ALERT",
      title: `Low Stock: ${product.sku} (${stockNum} left)`,
      body,
      referenceId: product.id,
      metadata: { sku: product.sku, currentStock: stockNum },
    });
  }

  /**
   * 7. Password Reset Notification
   */
  async notifyPasswordReset({ user, resetToken }) {
    const resetUrl = `https://www.kingletbd.com/reset-password?token=${resetToken}&phone=${encodeURIComponent(user.phone)}`;
    const body = `Kinglet Furniture: Your password reset code/link is: ${resetToken}. Or reset securely at ${resetUrl}. Valid for 1 hour.`;

    const smsResult = await smsService.sendSms({
      recipient: user.phone,
      message: body,
      event: "PASSWORD_RESET",
    });

    return await this.recordLog({
      recipient: user.phone,
      audience: "CUSTOMER",
      channel: "SMS",
      event: "PASSWORD_RESET",
      title: "Password Reset Code",
      body,
      status: smsResult.status || (smsResult.success ? "SENT" : "FAILED"),
      provider: smsResult.provider || "SMS_DISPATCHER",
      referenceId: user.id,
      metadata: { resetToken, expiresMinutes: 60 },
    });
  }

  /**
   * 8. Fetch Notification Logs for Admin Audit / Notification Bell
   */
  async getLogs({ limit = 50, event, channel, audience, unreadOnly } = {}) {
    return await prisma.notificationLog.findMany({
      where: {
        ...(event ? { event } : {}),
        ...(channel ? { channel } : {}),
        ...(audience ? { audience } : {}),
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit) || 50,
    });
  }
}

export const notificationService = new NotificationService();
