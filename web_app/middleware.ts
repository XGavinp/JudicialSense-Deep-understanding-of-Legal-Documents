// Remove the authentication middleware
// import { withAuth } from "next-auth/middleware"

// export default withAuth({
//   callbacks: {
//     authorized({ req, token }) {
//       // `/admin` requires admin role
//       if (req.nextUrl.pathname === "/admin") {
//         return token?.userRole === "admin"
//       }
//       // `/me` only requires the user to be logged in
//       return !!token
//     },
//   },
// })

// export const config = { matcher: ["/admin", "/me"] }

// Instead, you can simply export an empty middleware if needed
export default function middleware() {
  // No authentication logic
}