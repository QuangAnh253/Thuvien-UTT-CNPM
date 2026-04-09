import { createBrowserRouter } from 'react-router';
import { createElement } from 'react';
import ProtectedRoute from './lib/ProtectedRoute';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import AdminDashboard from './components/AdminDashboard';
import AdminProfilePage from './components/AdminProfilePage';
import BooksPage from './components/BooksPage';
import BookDetailPage from './components/BookDetailPage';
import ReadersPage from './components/ReadersPage';
import ReaderDetailPage from './components/ReaderDetailPage';
import BorrowPage from './components/BorrowPage';
import BorrowDetailPage from './components/BorrowDetailPage';
import ReturnPage from './components/ReturnPage';
import StaffPage from './components/StaffPage';
import ReportsPage from './components/ReportsPage';
import PublicBooksPage from './components/PublicBooksPage';
import PublicBookDetailPage from './components/PublicBookDetailPage';
import StudentDashboard from './components/StudentDashboard';
import StudentHistoryPage from './components/StudentHistoryPage';
import StudentProfilePage from './components/StudentProfilePage';

const withProtectedRoute = (roles: string[], child: React.ReactElement) =>
  createElement(ProtectedRoute, { roles, children: child });

export const router = createBrowserRouter([
  {
    path: '/',
    Component: HomePage,
  },
  {
    path: '/about',
    Component: AboutPage,
  },
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    path: '/books',
    Component: PublicBooksPage,
  },
  {
    path: '/books/:id',
    Component: PublicBookDetailPage,
  },
  {
    path: '/student/dashboard',
    element: withProtectedRoute(['student'], createElement(StudentDashboard)),
  },
  {
    path: '/student/history',
    element: withProtectedRoute(['student'], createElement(StudentHistoryPage)),
  },
  {
    path: '/student/profile',
    element: withProtectedRoute(['student'], createElement(StudentProfilePage)),
  },
  {
    path: '/admin/dashboard',
    element: withProtectedRoute(['admin', 'librarian'], createElement(AdminDashboard)),
  },
  {
    path: '/admin/profile',
    element: withProtectedRoute(['admin', 'librarian'], createElement(AdminProfilePage)),
  },
  {
    path: '/admin/books',
    element: withProtectedRoute(['admin', 'librarian'], createElement(BooksPage)),
  },
  {
    path: '/admin/books/:id',
    element: withProtectedRoute(['admin', 'librarian'], createElement(BookDetailPage)),
  },
  {
    path: '/admin/readers',
    element: withProtectedRoute(['admin', 'librarian'], createElement(ReadersPage)),
  },
  {
    path: '/admin/readers/:id',
    element: withProtectedRoute(['admin', 'librarian'], createElement(ReaderDetailPage)),
  },
  {
    path: '/admin/borrow',
    element: withProtectedRoute(['admin', 'librarian'], createElement(BorrowPage)),
  },
  {
    path: '/admin/borrow/:id',
    element: withProtectedRoute(['admin', 'librarian'], createElement(BorrowDetailPage)),
  },
  {
    path: '/admin/return',
    element: withProtectedRoute(['admin', 'librarian'], createElement(ReturnPage)),
  },
  {
    path: '/admin/staff',
    element: withProtectedRoute(['admin'], createElement(StaffPage)),
  },
  {
    path: '/admin/reports',
    element: withProtectedRoute(['admin', 'librarian'], createElement(ReportsPage)),
  },
]);
