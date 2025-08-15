export async function sendToCloud(
  payload: any,
  opts: { cloud?: boolean; cloudUrl?: string; projectId?: string; token?: string } = {}
) {
  if (!opts.cloud) return;
  if (!opts.cloudUrl || !opts.projectId) return;

  const url = opts.cloudUrl.replace(/\/$/, "") + "/ingest";
  await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {})
    },
    body: JSON.stringify({ project: opts.projectId, kind: "audit", payload })
  }).catch((e: any) => {
    // non-fatal
    console.warn("Cloud send failed:", e?.message || e);
  });
}
