// Trigger.dev job scaffold: generate PDF/Excel and upload to Cloudinary.
import { db } from "@/lib/db";
import { exportJobs } from "@/lib/db/schema";
import { pdf, Document, Page, Text, StyleSheet } from "@react-pdf/renderer";
import ExcelJS from "exceljs";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getWebhookUrl() {
  const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/api/webhooks/trigger`;
}

async function sendWebhook(payload: Record<string, unknown>) {
  const url = getWebhookUrl();
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.TRIGGER_WEBHOOK_SECRET
        ? { "x-trigger-webhook-secret": process.env.TRIGGER_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify(payload),
  });
}

type ExportRow = { label: string; value: unknown };

type ExportParams = {
  title?: string;
  rows?: unknown;
  [key: string]: unknown;
};

function isExportRowArray(value: unknown): value is ExportRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        "label" in item &&
        "value" in item,
    )
  );
}

function rowsFromParams(params: unknown): Array<ExportRow | unknown> {
  if (params && typeof params === "object" && !Array.isArray(params)) {
    const typedParams = params as ExportParams;
    if (isExportRowArray(typedParams.rows)) {
      return typedParams.rows;
    }
    return Object.entries(typedParams).map(([key, value]) => ({ label: key, value }));
  }
  return [];
}

export async function exportStatementJob(jobId: string) {
  const job = await db.query.exportJobs.findFirst({ where: exportJobs.id.eq(jobId) });
  if (!job) throw new Error("Job not found");

  await db.update(exportJobs).set({ status: "running", updatedAt: new Date().toISOString() }).where(exportJobs.id.eq(jobId));

  try {
    const params = job.params ? JSON.parse(job.params) : {};
    const type = job.jobType || "pdf";
    const title = params.title ?? `Export ${new Date().toISOString()}`;
    const dataRows = rowsFromParams(params);

    let fileUrl: string | null = null;

    if (type === "pdf") {
      const styles = StyleSheet.create({
        page: { padding: 24 },
        title: { fontSize: 18, marginBottom: 12 },
        header: { fontSize: 12, marginBottom: 8, fontWeight: "bold" },
        row: { fontSize: 10, marginBottom: 4 },
      });

      const doc = (
        <Document>
          <Page style={styles.page} size="A4">
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.header}>Generated: {new Date().toISOString()}</Text>
            {dataRows.map((row, index) => {
              const label = row !== null && typeof row === "object" ? (row as Record<string, unknown>).label : undefined;
              const value = row !== null && typeof row === "object" ? (row as Record<string, unknown>).value : row;
              return (
                <Text key={index} style={styles.row}>
                  {label ? `${label}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}` : String(row)}
                </Text>
              );
            })}
          </Page>
        </Document>
      );

      const buffer = await pdf(doc).toBuffer();
      const b64 = buffer.toString("base64");
      const dataUri = `data:application/pdf;base64,${b64}`;
      const uploaded = await cloudinary.v2.uploader.upload(dataUri, { resource_type: "raw", folder: "exports" });
      fileUrl = uploaded.secure_url;
    } else if (type === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(title.substring(0, 31));

      const headers =
        Array.isArray(dataRows) &&
        dataRows.length > 0 &&
        dataRows[0] !== null &&
        typeof dataRows[0] === "object"
          ? Object.keys(dataRows[0] as Record<string, unknown>).map((key) => key.charAt(0).toUpperCase() + key.slice(1))
          : ["Value"];

      sheet.addRow(headers);
      dataRows.forEach((row) => {
        if (row !== null && typeof row === "object") {
          const record = row as Record<string, unknown>;
          sheet.addRow(
            headers.map((header) => {
              const key = header.charAt(0).toLowerCase() + header.slice(1);
              const value = record[key] ?? record[header] ?? "";
              return typeof value === "object" ? JSON.stringify(value) : String(value);
            }),
          );
        } else {
          sheet.addRow([String(row)]);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const b64 = Buffer.from(buffer).toString("base64");
      const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${b64}`;
      const uploaded = await cloudinary.v2.uploader.upload(dataUri, { resource_type: "raw", folder: "exports" });
      fileUrl = uploaded.secure_url;
    } else {
      throw new Error("Unknown export type");
    }

    await sendWebhook({ jobId, status: "completed", fileUrl, message: "OK" });
    return { ok: true, url: fileUrl };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await sendWebhook({ jobId, status: "failed", message });
    throw error;
  }
}
