export function checkAdminAuth(request) {
  const token = request.headers.get('x-admin-token');
  return token && token === process.env.ADMIN_PASSWORD;
}
