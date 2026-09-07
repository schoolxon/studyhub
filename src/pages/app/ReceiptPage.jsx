import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Button, PageHeader } from "../../components/ui/ui";
import { api } from "../../lib/api";
import { formatInr } from "../../lib/money";

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api(`/v1/payments/${id}/receipt`)
      .then((data) => {
        if (!cancelled) {
          setReceipt(data.receipt);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const paidAt = receipt?.paidAt
    ? new Date(receipt.paidAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "";

  return (
    <div className="p-6">
      <div className="sh-no-print">
        <p className="text-sm mb-3">
          <Link to="/app/invoices" style={{ color: "var(--secondary)" }}>
            Invoices
          </Link>
          <span style={{ color: "var(--muted-foreground)" }}> / Receipt</span>
        </p>
        <PageHeader
          title="Receipt"
          description="Browser print. Thermal and GST PDF can wait."
          actions={
            <Button variant="primary" onClick={() => window.print()} disabled={!receipt}>
              Print
            </Button>
          }
        />
        {error ? <Alert variant="error">{error}</Alert> : null}
      </div>

      {receipt ? (
        <article className="sh-receipt">
          <header className="sh-receipt-head">
            <h1>{receipt.libraryName}</h1>
            <p>
              {receipt.branchName} ({receipt.branchCode})
            </p>
            {receipt.gstin ? <p>GSTIN {receipt.gstin}</p> : null}
          </header>
          <p className="sh-receipt-no">{receipt.receiptNo}</p>
          <dl className="sh-receipt-meta">
            <div>
              <dt>Student</dt>
              <dd>
                {receipt.studentName}
                {receipt.studentCode ? ` · ${receipt.studentCode}` : ""}
              </dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>{receipt.mobile}</dd>
            </div>
            <div>
              <dt>Seat</dt>
              <dd>{receipt.seatNo || "—"}</dd>
            </div>
            <div>
              <dt>Invoice</dt>
              <dd>{receipt.invoiceNo || "Advance"}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{receipt.mode}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{paidAt}</dd>
            </div>
          </dl>
          <p className="sh-receipt-amount">{formatInr(receipt.amountPaise)}</p>
          {receipt.note ? <p className="sh-receipt-note">{receipt.note}</p> : null}
          <p className="sh-receipt-foot">Thank you. This is a computer-generated receipt.</p>
        </article>
      ) : !error ? (
        <p className="sh-no-print" style={{ color: "var(--muted-foreground)" }}>
          Loading receipt…
        </p>
      ) : null}
    </div>
  );
}
