// components/Layout.tsx
import Link from 'next/link';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <header>
                <h1>JudicialSense - Deep Understanding of Legal Documents</h1>
                <nav>
                    <Link href="/">Home</Link>
                    <Link href="/about">About</Link>
                    <Link href="/project-details">Project Details</Link>
                </nav>
            </header>
            <main>{children}</main>
            <footer>
                <p>&copy; 2024 JudicialSense. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Layout;
