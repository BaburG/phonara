// src/middleware.ts
export { default } from "next-auth/middleware"

// Applies next-auth to the entire project
// Adjust matcher to protect specific routes
export const config = { matcher: ["/", "/transcript"] } // Protect home and transcript page 