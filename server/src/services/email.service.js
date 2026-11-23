import nodemailer from "nodemailer";

/**
 * Kinglet Furniture - Transactional Email Dispatcher Service
 * Supports standard SMTP (Gmail, SendGrid, Amazon SES, Mailgun, or local Ethereal sandbox)
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initTransporter();
  }

  initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.initialized = true;
    } else {
      // In development or when SMTP is unconfigured, create a memory/test transporter or simulated logger
      this.transporter = null;
      this.initialized = false;
    }
  }

  isConfigured() {
    return Boolean(this.initialized && this.transporter);
  }

  /**
   * 1. Send Order Confirmation Email with Brand Invoice Table
   */
  async sendOrderConfirmationEmail({ order, items = [] }) {
    const to = order.customerEmail;
    if (!to) return { success: false, reason: "No email provided by customer" };

    const orderNumber = order.orderNumber;
    const trackingUrl = `https://www.kingletbd.com/track-order?code=${orderNumber}`;
    const formattedTotal = Number(order.grandTotal).toLocaleString();
    const formattedSubtotal = Number(order.subtotal).toLocaleString();
    const formattedDelivery = Number(order.deliveryFee).toLocaleString();
    const formattedDiscount = Number(order.discountAmount || 0).toLocaleString();

    const itemsHtml = (order.items || items)
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-size: 13px; color: #1f2937;">
            <strong>${item.productName || item.name}</strong><br/>
            <span style="font-size: 11px; color: #6b7280;">Timber: ${item.woodType || "Seasoned Mahogany"} | Size: ${item.dimensions || "Standard"}</span>
          </td>
          <td style="padding: 12px 8px; font-size: 13px; text-align: center; color: #4b5563;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 12px 8px; font-size: 13px; text-align: right; font-weight: 700; color: #111827;">
            ৳${Number(item.totalPrice || item.priceBDT * (item.quantity || 1)).toLocaleString()}
          </td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - Kinglet Furniture</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1f2937;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <div style="background: #111827; padding: 28px 32px; text-align: center; border-bottom: 3px solid #ec2226;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">
              KINGLET FURNITURE & INTERIOR
            </h1>
            <p style="color: #9ca3af; margin: 6px 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
              Handcrafted Seasoned Timber Masterpieces
            </p>
          </div>

          <!-- Body -->
          <div style="padding: 32px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
              <div>
                <span style="font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 700;">Order Reference</span>
                <h2 style="margin: 4px 0 0; font-size: 20px; color: #ec2226; font-weight: 800;">${orderNumber}</h2>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 12px; color: #6b7280;">Order Date:</span><br/>
                <strong style="font-size: 13px; color: #111827;">${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>
              </div>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #374151;">
              Dear <strong>${order.customerName}</strong>,<br/>
              Thank you for choosing Kinglet Furniture. Your order has been placed successfully and has entered our factory queue for seasoning inspection and master-crafting.
            </p>

            <!-- Line Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0 16px;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 10px 8px; font-size: 11px; text-align: left; color: #64748b; text-transform: uppercase;">Item Description</th>
                  <th style="padding: 10px 8px; font-size: 11px; text-align: center; color: #64748b; text-transform: uppercase;">Qty</th>
                  <th style="padding: 10px 8px; font-size: 11px; text-align: right; color: #64748b; text-transform: uppercase;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Financial Summary -->
            <div style="background: #fdf2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 6px;">
                <span>Subtotal</span>
                <span>৳${formattedSubtotal}</span>
              </div>
              ${order.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #16a34a; font-weight: 700; margin-bottom: 6px;">
                <span>Coupon / Promotional Discount</span>
                <span>-৳${formattedDiscount}</span>
              </div>` : ""}
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; margin-bottom: 10px;">
                <span>Delivery Charge</span>
                <span>${order.deliveryFee > 0 ? `৳${formattedDelivery}` : "Based on Location (Payable on delivery)"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #111827; border-top: 1px solid #fca5a5; padding-top: 10px;">
                <span>Total Amount</span>
                <span style="color: #ec2226;">৳${formattedTotal}</span>
              </div>
            </div>

            <!-- Delivery & Payment Snapshot -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 12px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
              <strong>Delivery Destination:</strong> ${order.shippingAddress}, ${order.thana}, ${order.division}<br/>
              <strong>Contact Phone:</strong> ${order.customerPhone}<br/>
              <strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus})
            </div>

            <!-- Call to action button -->
            <div style="text-align: center; margin: 30px 0 16px;">
              <a href="${trackingUrl}" style="background: #ec2226; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 13px; font-weight: 700; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(236,34,38,0.25);">
                Track Order &amp; Production Status
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
            Kinglet Furniture &amp; Interior • 752/2 West Shewrapara, Mirpur, Dhaka 1216<br/>
            Hotline: +8801676900442 • Email: support@kingletbd.com • 10-Year Timber Warranty Protection
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendMail({
      to,
      subject: `Order Confirmed: ${orderNumber} | Kinglet Handcrafted Furniture`,
      html,
    });
  }

  /**
   * 2. Send Order Status Change Notification
   */
  async sendOrderStatusEmail({ order, newStatus, comment }) {
    const to = order.customerEmail;
    if (!to) return { success: false, reason: "No email provided" };

    const readableStatus = newStatus.replace(/_/g, " ");
    const trackingUrl = `https://www.kingletbd.com/track-order?code=${order.orderNumber}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #ec2226; margin-top: 0;">Order Status Update</h2>
        <p>Dear <strong>${order.customerName}</strong>,</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been updated to:</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px 16px; font-size: 16px; font-weight: 800; color: #b91c1c; margin: 16px 0;">
          ${readableStatus}
        </div>
        ${comment ? `<p style="color: #4b5563; font-style: italic;">"${comment}"</p>` : ""}
        <p><a href="${trackingUrl}" style="background: #111827; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-block;">View 7-Step Progress Timeline</a></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <small style="color: #9ca3af;">Kinglet Furniture & Interior • Helpline: +8801676900442</small>
      </div>
    `;

    return await this.sendMail({
      to,
      subject: `Update on Order ${order.orderNumber}: ${readableStatus}`,
      html,
    });
  }

  /**
   * Low-level mail transport dispatch
   */
  async sendMail({ to, subject, html, text }) {
    if (!this.isConfigured()) {
      console.log(`[EmailService:Simulated] To: ${to} | Subject: "${subject}" | (SMTP not configured in .env)`);
      return {
        success: true,
        simulated: true,
        messageId: `sim-${Date.now()}`,
        status: "CONFIG_REQUIRED",
      };
    }

    try {
      const from = process.env.SMTP_FROM || '"Kinglet Furniture & Interior" <no-reply@kingletbd.com>';
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      });
      return { success: true, messageId: info.messageId, status: "SENT" };
    } catch (err) {
      console.error("[EmailService:Error]", err.message);
      return { success: false, error: err.message, status: "FAILED" };
    }
  }
}

export const emailService = new EmailService();

