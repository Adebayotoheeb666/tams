import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExportJob, getExportJobs } from "@/lib/actions/exports";

export default async function ExportsPage() {
  const jobs = await getExportJobs();

  async function exportPdf() {
    await createExportJob("pdf", {
      title: "Financial statement export",
      requestedAt: new Date().toISOString(),
      type: "statement",
    });
  }

  async function exportExcel() {
    await createExportJob("excel", {
      title: "Financial statement export",
      requestedAt: new Date().toISOString(),
      type: "statement",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
          <p className="text-muted-foreground">Trigger background export jobs and monitor file status.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={exportPdf}>
            <Button type="submit">Export PDF</Button>
          </form>
          <form action={exportExcel}>
            <Button type="submit" variant="outline">Export Excel</Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">No export jobs have been created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Job ID</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Created</th>
                    <th className="p-3 font-medium">Result</th>
                    <th className="p-3 font-medium">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="p-3 break-all">{job.id}</td>
                      <td className="p-3">{job.jobType}</td>
                      <td className="p-3">{job.status}</td>
                      <td className="p-3">{job.createdAt}</td>
                      <td className="p-3">{job.resultMessage ?? "—"}</td>
                      <td className="p-3">
                        {job.fileUrl ? (
                          <a href={job.fileUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                            Download
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
