// সব error-এর একই আকার: { error: { code, message, details? } }
// Client এই `code` দেখে ঠিক করে কী দেখাবে, আর `message` মানুষের জন্য।
export const fail = (res, status, code, message, details) =>
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });

export function notFound(req, res) {
  fail(res, 404, 'ROUTE_NOT_FOUND', `${req.method} ${req.originalUrl} নামে কোনো endpoint নেই`);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return fail(res, 400, 'INVALID_JSON', 'Request body ঠিক JSON নয়');
  }
  console.error(err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Server-এ অপ্রত্যাশিত গোলমাল হয়েছে');
}
