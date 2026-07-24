// Developed By: Vishnukarthick K

// Acts on a GatewayRedirect from the backend: Kotak/CCAvenue → auto-submit a form POST to the
// hosted payment page; UCO → a plain redirect. Returns false (with a toast) when the gateway
// isn't configured yet so the caller can stop.
import { toast } from "@/lib/toast";
import { celebrate } from "@/lib/celebrate";

export function goToGateway(res) {
  if (!res || !res.gatewayConfigured) {
    toast.info(res?.message || "Online payment gateway is not enabled yet.");
    return false;
  }

  const method = (res.method || "GET").toUpperCase();

  if (method === "POST") {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = res.url;
    Object.entries(res.fields || {}).forEach(([n, v]) => {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = n; i.value = v ?? "";
      form.appendChild(i);
    });
    document.body.appendChild(form);
    form.submit();
  } else {
    window.location.assign(res.url);
  }
  return true;
}

// Read ?payment=success|failed left by the backend return redirect, toast it, and clean the URL.
export function handlePaymentReturn() {
  const p = new URLSearchParams(window.location.search).get("payment");
  if (p === "success") { toast.success("Payment successful."); celebrate(); }
  else if (p === "failed") toast.error("Payment was not completed. Please try again.");
  if (p) window.history.replaceState({}, "", window.location.pathname);
  return p;
}
