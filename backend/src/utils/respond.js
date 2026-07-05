// Enforce the API success contract: { success:true, message, data }.
export const ok = (res, data = {}, message = 'OK', status = 200) => {
  return res.status(status).json({ success: true, message, data });
}
