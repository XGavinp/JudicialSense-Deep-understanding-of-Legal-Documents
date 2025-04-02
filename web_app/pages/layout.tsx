// components/Layout.tsx
import Link from 'next/link';
import { motion } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="layout-container">
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="header"
      >
        <header>
        <h1>JudicialSense - Deep Understanding of Legal Documents</h1>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/project-details">Project Details</Link>
          <Link href="/keyquestions">Key Questions</Link>
        </nav>
        </header>
      </motion.header>
      <main>{children}</main>
      <footer>
        <p>&copy; 2025 JudicialSense. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
