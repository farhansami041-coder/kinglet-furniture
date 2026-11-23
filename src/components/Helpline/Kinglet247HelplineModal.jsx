import React, { useState, useEffect, useRef } from "react";
import { 
  X, MessageSquare, AlertCircle, Phone, Send, CheckCircle2, 
  MapPin, Clock, ArrowRight, Bot, User, Sparkles, RefreshCw, 
  PhoneCall, ShieldAlert, ExternalLink
} from "lucide-react";
import { BRAND_INFO } from "../../data/kingletData";
import { getChatbotResponse } from "../../utils/kingletChatbotBrain";

export default function Kinglet247HelplineModal({ isOpen, onClose, initialTab = "chat" }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'chat' | 'report' | 'hotline'
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      time: "Just now",
      text: "আসসালামু আলাইকুম! Kinglet Furniture 24/7 হেল্পলাইনে আপনাকে স্বাগতম। আমি আপনার ভার্চুয়াল কনসিয়ার্জ। আপনি বাংলা, English বা Banglish-এ যেকোনো প্রশ্ন করতে পারেন (যেমন: 'bed er price koto?', 'showroom kothay?', 'delivery charge koto?'). আমি কীভাবে আপনাকে সাহায্য করতে পারি?",
      suggestions: ["খাটের সাইজ ও দাম", "ঢাকার বাইরে ডেলিভারি", "অথেনটিক কাঠ ও ওয়ারেন্টি", "শোরুমের ঠিকানা", "সমস্যা রিপোর্ট করুন"]
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Problem report state
  const [reportForm, setReportForm] = useState({
    name: "",
    phone: "",
    orderId: "",
    issueType: "delivery-delay",
    details: "",
  });
  const [submittedTicket, setSubmittedTicket] = useState(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeTab]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    // Simulate smart thinking delay
    setTimeout(() => {
      const responseData = getChatbotResponse(text);
      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: responseData.reply,
        suggestions: responseData.suggestions || [],
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.name || !reportForm.phone || !reportForm.details) {
      alert("Please provide your name, phone number, and issue details.");
      return;
    }

    const ticketId = `KL-TICK-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticketData = {
      id: ticketId,
      ...reportForm,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for historical tracking
    try {
      const savedTickets = JSON.parse(localStorage.getItem("kinglet_support_tickets") || "[]");
      savedTickets.unshift(ticketData);
      localStorage.setItem("kinglet_support_tickets", JSON.stringify(savedTickets));
    } catch {
      // Ignore storage error
    }

    // Also persist to real backend API database
    try {
      await fetch("/api/v1/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: reportForm.name,
          customerPhone: reportForm.phone,
          orderNumber: reportForm.orderId || null,
          issueType: reportForm.issueType,
          description: reportForm.details,
        }),
      });
    } catch (apiErr) {
      console.warn("Backend ticket sync fallback:", apiErr);
    }

    setSubmittedTicket(ticketData);
  };

  const resetReportForm = () => {
    setSubmittedTicket(null);
    setReportForm({
      name: "",
      phone: "",
      orderId: "",
      issueType: "delivery-delay",
      details: "",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "520px",
          height: "640px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06)",
          overflow: "hidden",
          animation: "scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
            color: "#ffffff",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#ec2226",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(236, 34, 38, 0.35)",
                }}
              >
                <Bot size={22} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", margin: 0 }}>
                    Kinglet 24/7 Helpline & Concierge
                  </h3>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#22c55e",
                      display: "inline-block",
                      boxShadow: "0 0 8px #22c55e",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11.5px", color: "#9ca3af", marginTop: "2px" }}>
                  Smart AI Assistant • Understands বাংলা, English & Banglish
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close helpline"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "6px",
              marginTop: "14px",
              background: "rgba(255, 255, 255, 0.08)",
              padding: "4px",
              borderRadius: "10px",
            }}
          >
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                background: activeTab === "chat" ? "#ec2226" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "7px",
                padding: "7px 6px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <MessageSquare size={13} />
              AI Chatbot
            </button>

            <button
              onClick={() => setActiveTab("report")}
              style={{
                background: activeTab === "report" ? "#ec2226" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "7px",
                padding: "7px 6px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <AlertCircle size={13} />
              Report Issue
            </button>

            <button
              onClick={() => setActiveTab("hotline")}
              style={{
                background: activeTab === "hotline" ? "#ec2226" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "7px",
                padding: "7px 6px",
                fontSize: "12px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Phone size={13} />
              24/7 Helpline
            </button>
          </div>
        </div>

        {/* Tab 1: AI Chatbot */}
        {activeTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 130px)", background: "#f8fafc" }}>
            {/* Messages Scroll Area */}
            <div
              style={{
                flexGrow: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "8px",
                      maxWidth: "85%",
                      flexDirection: msg.sender === "user" ? "row-reverse" : "row",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: msg.sender === "user" ? "#111827" : "#ec2226",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "11px",
                      }}
                    >
                      {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    <div
                      style={{
                        background: msg.sender === "user" ? "#ec2226" : "#ffffff",
                        color: msg.sender === "user" ? "#ffffff" : "#1f2937",
                        padding: "11px 14px",
                        borderRadius: msg.sender === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                        fontSize: "13px",
                        lineHeight: "1.55",
                        whiteSpace: "pre-line",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                        border: msg.sender === "user" ? "none" : "1px solid #e2e8f0",
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>

                  <span style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", marginInline: "36px" }}>
                    {msg.time}
                  </span>

                  {/* Contextual Suggestion Pills */}
                  {msg.sender === "bot" && msg.suggestions && msg.suggestions.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "8px",
                        marginLeft: "36px",
                      }}
                    >
                      {msg.suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(sug)}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #d1d5db",
                            color: "#374151",
                            fontSize: "11.5px",
                            fontWeight: "600",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#ec2226";
                            e.currentTarget.style.color = "#ec2226";
                            e.currentTarget.style.background = "#fff5f5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#d1d5db";
                            e.currentTarget.style.color = "#374151";
                            e.currentTarget.style.background = "#ffffff";
                          }}
                        >
                          <Sparkles size={11} color="#ec2226" />
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#ec2226",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Bot size={14} />
                  </div>
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      padding: "8px 14px",
                      borderRadius: "14px 14px 14px 2px",
                      fontSize: "12px",
                      color: "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span style={{ fontStyle: "italic" }}>Assistant is replying...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: "12px 14px",
                background: "#ffffff",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  id="helpline-chat-input"
                  name="chatMessage"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask in বাংলা, English or Banglish..."
                  style={{
                    flexGrow: 1,
                    height: "44px",
                    padding: "0 14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "10px",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#ec2226")}
                  onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: inputText.trim() ? "#ec2226" : "#e5e7eb",
                    color: "#ffffff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: inputText.trim() ? "pointer" : "default",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Report an Issue */}
        {activeTab === "report" && (
          <div style={{ flexGrow: 1, overflowY: "auto", padding: "20px", background: "#f8fafc" }}>
            {!submittedTicket ? (
              <form onSubmit={handleReportSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <ShieldAlert size={18} color="#ec2226" />
                    <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", margin: 0 }}>
                      Report a Problem or Complaint
                    </h4>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    Our quality escalation team addresses every issue within 24 hours with an official Ticket ID.
                  </p>
                </div>

                {/* Issue Category */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    Issue Type / সমস্যার ধরণ *
                  </label>
                  <select
                    id="helpline-issue-type"
                    name="issueType"
                    value={reportForm.issueType}
                    onChange={(e) => setReportForm({ ...reportForm, issueType: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      background: "#ffffff",
                      outline: "none",
                    }}
                  >
                    <option value="delivery-delay">Delivery Delay / ডেলিভারি বিলম্ব</option>
                    <option value="damage-scratch">Product Damage or Scratch / স্ক্র্যাচ বা ক্ষতি</option>
                    <option value="carpenter-fitting">Free Carpenter Assembly Request / মিস্ত্রি ও ফিটিং সেবা</option>
                    <option value="wrong-item">Wrong Item Received / ভিন্ন পণ্য এসেছে</option>
                    <option value="warranty-claim">10-Year Timber Warranty Claim / ওয়ারেন্টি ক্লেইম</option>
                    <option value="payment-issue">Payment or Invoice Issue / পেমেন্ট সমস্যা</option>
                    <option value="other">Other Inquiry / অন্যান্য</option>
                  </select>
                </div>

                {/* Name */}
                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="helpline-customer-name" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    Your Name / আপনার নাম *
                  </label>
                  <input
                    id="helpline-customer-name"
                    name="customerName"
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={reportForm.name}
                    onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="helpline-customer-phone" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    Contact Phone / মোবাইল নম্বর *
                  </label>
                  <input
                    id="helpline-customer-phone"
                    name="customerPhone"
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={reportForm.phone}
                    onChange={(e) => setReportForm({ ...reportForm, phone: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Invoice or Order Code */}
                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="helpline-order-id" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    Invoice / Order ID (Optional)
                  </label>
                  <input
                    id="helpline-order-id"
                    name="orderId"
                    type="text"
                    placeholder="e.g. KL-9842"
                    value={reportForm.orderId}
                    onChange={(e) => setReportForm({ ...reportForm, orderId: e.target.value })}
                    style={{
                      width: "100%",
                      height: "40px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Details */}
                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="helpline-issue-details" style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
                    Describe the Issue / সমস্যার বিস্তারিত বিবরণ *
                  </label>
                  <textarea
                    id="helpline-issue-details"
                    name="issueDetails"
                    required
                    rows={3}
                    placeholder="Describe what happened so our factory dispatch team can assist you quickly..."
                    value={reportForm.details}
                    onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    height: "44px",
                    background: "#ec2226",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(236, 34, 38, 0.25)",
                    transition: "background 0.2s",
                  }}
                >
                  Submit Official Complaint & Get Ticket ID
                </button>
              </form>
            ) : (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "24px 20px",
                  border: "1px solid #bbf7d0",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                  }}
                >
                  <CheckCircle2 size={30} />
                </div>

                <h4 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: "0 0 6px" }}>
                  Complaint Ticket Created!
                </h4>
                <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 16px" }}>
                  Thank you, <strong>{submittedTicket.name}</strong>. Your complaint has been lodged into Kinglet Quality Escalation Portal.
                </p>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1.5px dashed #cbd5e1",
                    borderRadius: "10px",
                    padding: "14px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                    Official Ticket Reference ID
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "#ec2226", letterSpacing: "1px", margin: "4px 0" }}>
                    {submittedTicket.id}
                  </div>
                  <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600" }}>
                    Status: Escalated to Factory Quality Manager
                  </div>
                </div>

                {/* Instant WhatsApp Forwarding Action */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <a
                    href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent(
                      `Hello Kinglet Support, I filed an urgent ticket:\nTicket ID: ${submittedTicket.id}\nName: ${submittedTicket.name}\nPhone: ${submittedTicket.phone}\nIssue: ${submittedTicket.issueType}\nDetails: ${submittedTicket.details}\nPlease resolve urgently.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "#25D366",
                      color: "#ffffff",
                      height: "44px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      textDecoration: "none",
                      boxShadow: "0 4px 12px rgba(37,211,102,0.25)",
                    }}
                  >
                    Forward to Urgent WhatsApp Support Desk
                  </a>

                  <button
                    onClick={resetReportForm}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      height: "38px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    <RefreshCw size={13} />
                    Submit Another Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: 24/7 Helpline Directory */}
        {activeTab === "hotline" && (
          <div style={{ flexGrow: 1, overflowY: "auto", padding: "20px", background: "#f8fafc" }}>
            <div style={{ marginBottom: "18px" }}>
              <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", margin: "0 0 4px" }}>
                24/7 Direct Telephone & Showroom Support
              </h4>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Speak directly with Kinglet specialists, dispatchers, or schedule an in-person showroom consultation.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              {/* Primary Hotline */}
              <a
                href={`tel:${BRAND_INFO.hotlinePrimary}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "1.5px solid #fecaca",
                  borderRadius: "12px",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(236,34,38,0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "#fee2e2",
                      color: "#ec2226",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#ec2226", textTransform: "uppercase" }}>
                      Primary 24/7 Helpline
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "900", color: "#111827", marginTop: "1px" }}>
                      {BRAND_INFO.hotlinePrimary}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>Customer Care & Order Placement</div>
                  </div>
                </div>
                <ArrowRight size={18} color="#ec2226" />
              </a>

              {/* Factory & Dispatch Secondary */}
              <a
                href={`tel:${BRAND_INFO.hotlineSecondary}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "#f1f5f9",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                      Factory Dispatch & Delivery Desk
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827", marginTop: "1px" }}>
                      {BRAND_INFO.hotlineSecondary}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>Direct Carpenter & Truck Dispatch</div>
                  </div>
                </div>
                <ArrowRight size={18} color="#94a3b8" />
              </a>

              {/* Showroom WhatsApp Tour */}
              <a
                href={`https://wa.me/${BRAND_INFO.whatsapp}?text=${encodeURIComponent("Hello Kinglet Furniture, I want live showroom video and timber inspection details.")}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#166534", textTransform: "uppercase" }}>
                      WhatsApp Live Video Desk
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "800", color: "#166534", marginTop: "1px" }}>
                      {BRAND_INFO.whatsapp}
                    </div>
                    <div style={{ fontSize: "11px", color: "#15803d" }}>Request Real Showroom Photos & Video</div>
                  </div>
                </div>
                <ExternalLink size={17} color="#16a34a" />
              </a>
            </div>

            {/* Showroom Physical Location Card */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                <MapPin size={18} color="#ec2226" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: "#111827" }}>
                    Mirpur Flagship Showroom & Experience Center
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", lineHeight: "1.5" }}>
                    {BRAND_INFO.address}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#059669", fontWeight: "600", paddingLeft: "28px" }}>
                <Clock size={14} />
                <span>Open Everyday except Sunday: 9:00 AM – 10:00 PM</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

