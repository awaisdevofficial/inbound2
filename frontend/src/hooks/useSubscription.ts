import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { toast } from "./use-toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const WEBHOOK_URL = "https://auto.nsolbpo.com/webhook/deactivation-code";

export interface SubscriptionPackage {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price: number;
  currency: string;
  credits_included: number;
  features: any;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  user_id: string;
  package_id: string | null;
  package_name: string;
  amount: number;
  currency: string;
  status: string;
  invoice_number: string;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  due_date: string | null;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  invoice_id: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const isPaid = profile?.payment_status === "paid";
  const isPending = profile?.payment_status === "pending";
  const isUnpaid = profile?.payment_status === "unpaid" || !profile?.payment_status;

  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: "Failed to load subscription packages",
        variant: "destructive",
      });
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      // Removed console.error for security
    }
  }, [user]);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data || null);
    } catch (error: any) {
      // Removed console.error for security
    }
  }, [user]);

  // Helper function to send professional invoice email
  const sendInvoiceEmail = async (invoice: Invoice): Promise<{ success: boolean; error?: string }> => {
    if (!user?.email) {
      return { success: false, error: "User email not found" };
    }

    try {
      // Format currency
      const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency || "USD",
        }).format(amount);
      };

      // Format date
      const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      // Get user/company information
      const customerName = profile?.full_name || user.email?.split("@")[0] || "Customer";
      const companyName = profile?.company_name || "";
      const companyAddress = profile?.company_address || "";
      const customerEmail = user.email;

      // Build bill to section
      let billToSection = `<strong>${customerName}</strong><br>`;
      if (companyName) billToSection += `${companyName}<br>`;
      if (companyAddress) billToSection += `${companyAddress}<br>`;
      billToSection += `${customerEmail}`;

      // Calculate totals
      const subtotal = invoice.amount;
      const tax = 0;
      const total = subtotal + tax;

      // Create professional HTML invoice
      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice ${invoice.invoice_number}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 8px 8px 0 0;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">INVOICE</h1>
                            <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Inbound Genie</p>
                          </td>
                          <td align="right">
                            <div style="background: rgba(255,255,255,0.2); padding: 15px 20px; border-radius: 6px; display: inline-block;">
                              <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">${invoice.invoice_number}</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                        <tr>
                          <td width="50%" style="vertical-align: top;">
                            <h3 style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Bill To:</h3>
                            <div style="color: #666666; font-size: 14px; line-height: 1.6;">
                              ${billToSection}
                            </div>
                          </td>
                          <td width="50%" style="vertical-align: top;" align="right">
                            <table cellpadding="0" cellspacing="0" style="text-align: right;">
                              <tr>
                                <td style="padding: 4px 0; color: #666666; font-size: 13px;">Invoice Date:</td>
                                <td style="padding: 4px 0; padding-left: 15px; color: #333333; font-size: 13px; font-weight: 600;">${formatDate(invoice.created_at)}</td>
                              </tr>
                              ${invoice.due_date ? `
                              <tr>
                                <td style="padding: 4px 0; color: #666666; font-size: 13px;">Due Date:</td>
                                <td style="padding: 4px 0; padding-left: 15px; color: #333333; font-size: 13px; font-weight: 600;">${formatDate(invoice.due_date)}</td>
                              </tr>
                              ` : ""}
                              <tr>
                                <td style="padding: 4px 0; color: #666666; font-size: 13px;">Status:</td>
                                <td style="padding: 4px 0; padding-left: 15px;">
                                  <span style="background: ${invoice.status === "paid" ? "#10b981" : "#f59e0b"}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">
                                    ${invoice.status}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                          <tr style="background-color: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; color: #333333; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e9ecef;">Description</th>
                            <th style="padding: 12px; text-align: right; color: #333333; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #e9ecef;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style="padding: 15px 12px; border-bottom: 1px solid #e9ecef; color: #333333; font-size: 14px;">
                              <strong>${invoice.package_name}</strong>
                              <br>
                              <span style="color: #666666; font-size: 12px;">Subscription Package</span>
                            </td>
                            <td style="padding: 15px 12px; border-bottom: 1px solid #e9ecef; text-align: right; color: #333333; font-size: 14px; font-weight: 600;">
                              ${formatCurrency(invoice.amount, invoice.currency)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                        <tr>
                          <td width="70%"></td>
                          <td width="30%">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 8px 0; text-align: right; color: #666666; font-size: 14px;">Subtotal:</td>
                                <td style="padding: 8px 0; padding-left: 15px; text-align: right; color: #333333; font-size: 14px; font-weight: 600;">${formatCurrency(subtotal, invoice.currency)}</td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; text-align: right; color: #333333; font-size: 16px; font-weight: 700; border-top: 2px solid #667eea;">Total:</td>
                                <td style="padding: 12px 0; padding-left: 15px; text-align: right; color: #667eea; font-size: 18px; font-weight: 700; border-top: 2px solid #667eea;">${formatCurrency(total, invoice.currency)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      ${invoice.status === "pending" ? `
                      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                          <strong>Payment Required:</strong> Please complete the payment to activate your subscription. Once payment is completed, mark the invoice as paid in your dashboard.
                        </p>
                      </div>
                      ` : ""}
                      <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                        <p style="margin: 0 0 10px 0; color: #666666; font-size: 12px; line-height: 1.6;">
                          <strong>Payment Instructions:</strong><br>
                          Please complete the payment and mark this invoice as paid in your dashboard to activate your subscription.
                        </p>
                        <p style="margin: 20px 0 0 0; color: #333333; font-size: 13px;">
                          Best regards,<br>
                          <strong>Inbound Genie Team</strong>
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const textBody = `
INVOICE ${invoice.invoice_number}
Inbound Genie

Bill To:
${customerName}${companyName ? `\n${companyName}` : ""}${companyAddress ? `\n${companyAddress}` : ""}
${customerEmail}

Invoice Date: ${formatDate(invoice.created_at)}
${invoice.due_date ? `Due Date: ${formatDate(invoice.due_date)}\n` : ""}Status: ${invoice.status.toUpperCase()}

Description: ${invoice.package_name}
Total: ${formatCurrency(total, invoice.currency)}

${invoice.status === "pending" ? "\nPayment Required: Please complete the payment to activate your subscription.\n" : ""}

Best regards,
Inbound Genie Team
      `.trim();

      // Send email via secure system endpoint
      const response = await fetch(`${BACKEND_URL}/api/send-system-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to_email: user.email,
          subject: `Invoice ${invoice.invoice_number} - ${invoice.package_name}`,
          body: textBody,
          html_body: htmlBody,
          type: "invoice",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Failed to send invoice email" };
    }
  };

  // Helper function to send invoice and deactivation code to webhook
  const sendToWebhook = async (invoice: Invoice, deactivationCode: string | null) => {
    try {
      const payload = {
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          package_name: invoice.package_name,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
          created_at: invoice.created_at,
          due_date: invoice.due_date,
        },
        user: {
          id: user?.id,
          email: user?.email,
          name: profile?.full_name,
        },
        deactivation_code: deactivationCode,
      };

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error: any) {
      // Silently handle webhook errors
    }
  };

  const createInvoice = async (packageId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an invoice",
        variant: "destructive",
      });
      return null;
    }

    try {
      const selectedPackage = packages.find((pkg) => pkg.id === packageId);
      if (!selectedPackage) {
        throw new Error("Package not found");
      }

      const { data: invoiceNumber, error } = await supabase.rpc("create_invoice", {
        p_user_id: user.id,
        p_package_id: packageId,
        p_package_name: selectedPackage.display_name,
        p_amount: selectedPackage.price,
        p_currency: selectedPackage.currency,
      });

      if (error) throw error;

      // Update profile payment status to pending
      await supabase
        .from("profiles")
        .update({ payment_status: "pending" })
        .eq("user_id", user.id);

      await fetchInvoices();

      // Get the newly created invoice details
      const { data: newInvoice } = await supabase
        .from("invoices")
        .select("*")
        .eq("invoice_number", invoiceNumber)
        .eq("user_id", user.id)
        .single();

      if (newInvoice) {
        // Get deactivation code from profile if it exists
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("deactivation_code")
          .eq("user_id", user.id)
          .single();

        const deactivationCode = (userProfile as any)?.deactivation_code || null;

        // Send invoice email to user
        const emailResult = await sendInvoiceEmail(newInvoice as Invoice);
        if (emailResult.success) {
          toast({
            title: "Invoice Created & Sent",
            description: `Invoice ${invoiceNumber} has been created and sent to your email.`,
          });
        } else {
          toast({
            title: "Invoice Created",
            description: `Invoice ${invoiceNumber} has been created. ${emailResult.error || "Email could not be sent."}`,
            variant: emailResult.error ? "destructive" : "default",
          });
        }

        // Send to webhook (async, don't wait)
        sendToWebhook(newInvoice as Invoice, deactivationCode).catch(() => {
          // Silently handle webhook errors
        });
      } else {
        toast({
          title: "Invoice Created",
          description: `Invoice ${invoiceNumber} has been created. Please complete payment.`,
        });
      }

      return invoiceNumber;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
      return null;
    }
  };

  const markInvoicePaid = async (
    invoiceId: string,
    paymentMethod?: string,
    paymentReference?: string
  ) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc("mark_invoice_paid", {
        p_invoice_id: invoiceId,
        p_payment_method: paymentMethod || null,
        p_payment_reference: paymentReference || null,
      });

      if (error) throw error;

      await fetchInvoices();
      await fetchSubscription();
      
      // Refresh profile to get updated payment_status
      window.location.reload(); // Simple way to refresh all data

      toast({
        title: "Payment Confirmed",
        description: "Your subscription is now active!",
      });

      return true;
    } catch (error: any) {
      // Removed console.error for security
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchPackages(), fetchInvoices(), fetchSubscription()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, fetchPackages, fetchInvoices, fetchSubscription]);

  return {
    packages,
    invoices,
    subscription,
    isPaid,
    isPending,
    isUnpaid,
    loading: loading || profileLoading,
    createInvoice,
    markInvoicePaid,
    refetch: () => {
      fetchPackages();
      fetchInvoices();
      fetchSubscription();
    },
  };
}
