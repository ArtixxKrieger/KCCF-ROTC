export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data }, init);
}

export function fail(error: string, status = 400): Response {
  return Response.json({ error }, { status });
}
