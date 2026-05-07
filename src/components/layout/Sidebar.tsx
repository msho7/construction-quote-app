import React from "react";
import { PageId, PageOption } from "../../types/appTypes";

type SidebarProps = {
  currentPage: PageId;
  pages: PageOption[];
  onChangePage: (page: PageId) => void;
};

export default function Sidebar({ currentPage, pages, onChangePage }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <h2 className="sidebar-title">🏗️</h2>
        <p className="sidebar-subtitle">Construction quoting and scheduling</p>
      </div>

      <nav className="nav-list">
        {pages.map((page) => (
          <button
            key={page.id}
            className={`nav-item ${currentPage === page.id ? "active" : ""}`}
            type="button"
            onClick={() => onChangePage(page.id)}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}