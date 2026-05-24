import { Button, Card } from "../ui";

export default function ServerPage({
  dark,
  serverStatus,
  storageStatus,
  onCheckServerMongoConnection
}) {
  const statusLabel = serverStatus.loading
    ? "Checking"
    : serverStatus.data?.ok
      ? "Connected"
      : serverStatus.error
        ? "Failed"
        : "Not Checked";
  const statusClass = serverStatus.data?.ok ? "active" : serverStatus.error ? "delayed" : "waiting";
  const storageLabel = storageStatus.loading
    ? "Loading"
    : storageStatus.saving
      ? "Saving"
      : storageStatus.connected
        ? "Saving To MongoDB"
        : "Local Fallback";
  const storageClass = storageStatus.connected ? "active" : storageStatus.error ? "delayed" : "waiting";

  return (
    <>
      <div className="stats-grid">
        <Card dark={dark}>
          <div className="stat-label">API Server</div>
          <div className="stat-value">localhost:3001</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">App Data</div>
          <div className="stat-value">{storageLabel}</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">Database</div>
          <div className="stat-value">{serverStatus.data?.databaseName || "Not loaded"}</div>
        </Card>
        <Card dark={dark}>
          <div className="stat-label">Collections</div>
          <div className="stat-value">{serverStatus.data?.collections?.length || 0}</div>
        </Card>
      </div>

      <div className="two-col-layout">
        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>Server Connection</h3>
              <p className="row-subtitle">Start the API server so app data loads from and saves to MongoDB through your .env.local settings.</p>
            </div>
            <span className={`status-pill ${statusClass}`}>{statusLabel}</span>
          </div>

          <div className="details-list">
            <div><strong>API command:</strong> npm run server</div>
            <div><strong>Frontend command:</strong> npm run dev</div>
            <div><strong>Status endpoint:</strong> /api/mongodb/status</div>
            <div><strong>Data endpoint:</strong> /api/app-state</div>
            <div><strong>Mongo collection:</strong> app_state</div>
            <div><strong>Required env:</strong> MONGODB_URI</div>
            <div><strong>Optional env:</strong> MONGODB_DB</div>
          </div>

          <div className="button-row server-actions">
            <Button onClick={onCheckServerMongoConnection} disabled={serverStatus.loading}>
              {serverStatus.loading ? "Checking..." : "Check MongoDB"}
            </Button>
          </div>
        </Card>

        <Card dark={dark}>
          <div className="section-header">
            <div>
              <h3>MongoDB App Data</h3>
              <p className="row-subtitle">Quotes, price list, customers, contractors, templates, and settings are saved through the server.</p>
            </div>
            <span className={`status-pill ${storageClass}`}>{storageLabel}</span>
          </div>

          {storageStatus.error ? (
            <div className="server-error-message">{storageStatus.error}</div>
          ) : null}

          <div className="details-list">
            <div><strong>Load status:</strong> {storageStatus.loading ? "Loading from MongoDB" : "Ready"}</div>
            <div><strong>Save status:</strong> {storageStatus.saving ? "Saving changes" : "Idle"}</div>
            <div><strong>Last saved:</strong> {storageStatus.lastSavedAt ? new Date(storageStatus.lastSavedAt).toLocaleString() : "Not saved this session"}</div>
            <div><strong>Fallback cache:</strong> localStorage remains updated for offline recovery.</div>
          </div>
        </Card>
      </div>

      <Card dark={dark}>
        <div className="section-header">
          <div>
            <h3>MongoDB Connection Result</h3>
            <p className="row-subtitle">The server returns connection metadata only. It does not expose your MongoDB URI.</p>
          </div>
        </div>

        {serverStatus.error ? (
          <div className="server-error-message">{serverStatus.error}</div>
        ) : null}

        {serverStatus.data ? (
          <div className="details-list">
            <div><strong>Connected:</strong> {serverStatus.data.ok ? "Yes" : "No"}</div>
            <div><strong>Database:</strong> {serverStatus.data.databaseName}</div>
            <div><strong>Checked:</strong> {new Date(serverStatus.data.checkedAt).toLocaleString()}</div>
            <div>
              <strong>Collections:</strong>{" "}
              {serverStatus.data.collections.length
                ? serverStatus.data.collections.join(", ")
                : "No collections found"}
            </div>
          </div>
        ) : (
          <p className="row-subtitle">No server result yet.</p>
        )}
      </Card>
    </>
  );
}
