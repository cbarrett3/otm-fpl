// Description: Light-weight Privacy Policy for OTM FPL Draftkit
export default function PrivacyPage() {
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <h1 className="text-2xl font-semibold text-yellow-400 -skew-x-6 mb-6">Privacy Policy</h1>
      <div className="prose prose-invert max-w-3xl text-sm text-white/80">
        <h3>Overview</h3>
        <p>
          We care about privacy and collect as little personal data as possible to operate the
          Service.
        </p>

        <h3>What we store</h3>
        <ul>
          <li><strong>Local data</strong>: Your rankings and license status are stored locally in your browser (cookies/localStorage).</li>
          <li><strong>Server logs</strong>: Basic request logs (timestamps, IP via hosting provider) for security and troubleshooting.</li>
          <li><strong>Payments</strong>: Payment information is processed by our provider (e.g., Stripe). We do not store full card details.</li>
        </ul>

        <h3>How we use information</h3>
        <ul>
          <li>Operate and improve the Service.</li>
          <li>Prevent abuse (e.g., limited rate‑limiting, fraud prevention by our payment provider).</li>
          <li>Provide support if you contact us.</li>
        </ul>

        <h3>Cookies</h3>
        <p>
          We use cookies to save your ranking and to remember license status. Clearing cookies will
          remove this data from your device.
        </p>

        <h3>Data sharing</h3>
        <p>
          We do not sell personal data. We may share minimal information with service providers
          (e.g., payment processing) to operate the Service.
        </p>

        <h3>Data retention</h3>
        <p>
          Local data persists on your device until you delete it. Server logs are retained briefly by
          our hosting provider. License tokens include an expiration.
        </p>

        <h3>Your choices</h3>
        <ul>
          <li>You may clear local data in your browser at any time.</li>
          <li>You can use your license token to re‑activate paid features on a new device.</li>
        </ul>

        <h3>Updates</h3>
        <p>
          We may update this Privacy Policy from time to time. Continued use of the Service after
          changes take effect means you agree to the updated policy.
        </p>
      </div>
    </div>
  )
}


