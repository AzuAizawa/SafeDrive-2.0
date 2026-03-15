# Todo List for SafeDrive Admin/User Separation

## Tasks

1. Remove the "View Live Site" button from AdminLayout.tsx that allows admin to navigate to the user site.
2. Create a UserRoute component that protects routes for non-admin users (role !== 'admin').
3. Update App.tsx to replace the ProtectedRoute wrapping user routes with the new UserRoute.
4. Modify LoginPage.tsx to check user role after sign-in and redirect admins to admin login with an error.
5. Modify AdminLoginPage.tsx to check user role after sign-in and redirect non-admins to user login with an error.
6. Verify that admins cannot access user routes and users cannot access admin routes.
7. Verify that cross-login is prevented (admins cannot log in via user login page, users cannot log in via admin login page).
