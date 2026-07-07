export function patientId(req) {
  return req.patientContext?.patientId ?? req.user.id;
}

export function isViewer(req) {
  return req.patientContext?.role === 'viewer';
}
