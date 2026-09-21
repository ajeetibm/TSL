/**
 * Starts loading the largest SME route before navigation changes the URL.
 * Without this, React can briefly leave the marketing page on screen while
 * the browser has already moved to /dashboard on a cold UAT cache.
 */
export const preloadUserDashboard = () => import('../pages/user-dashboard/Dashboard')
