import { Outlet } from "react-router-dom";
import { useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function DashboardLayout() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="min-h-screen bg-paper dark:bg-ink max-w-full overflow-x-hidden relative">
            <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <div className="md:pl-64 flex flex-col min-h-screen min-w-0 max-w-full overflow-x-hidden">
                <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />
                <main className="flex-1 p-4 sm:p-6 min-w-0 max-w-full overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
