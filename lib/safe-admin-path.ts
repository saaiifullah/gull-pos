export const readAdminNext = (value: string | string[] | undefined) => {
  const requested = Array.isArray(value) ? value[0] : value;
  if (requested === "/admin" || requested?.startsWith("/admin/")) return requested;
  return "/admin";
};
