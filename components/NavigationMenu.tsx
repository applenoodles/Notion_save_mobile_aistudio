/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Page } from '../App';

interface NavigationMenuProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    isConnectionReady: boolean;
}

export const NavigationMenu = ({ currentPage, setCurrentPage, isConnectionReady }: NavigationMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        setIsOpen(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems: { id: Page; label: string; unlocked: boolean }[] = [
        { id: 'settings', label: '設定 & 連線', unlocked: true },
        { id: 'system-prompt', label: 'System Prompt 設定', unlocked: isConnectionReady },
        { id: 'content-input', label: '新增內容與處理', unlocked: isConnectionReady }
    ];

    return (
        <div className="navigation-menu" ref={menuRef}>
            <button 
                className="menu-icon" 
                onClick={() => setIsOpen(!isOpen)} 
                aria-haspopup="true" 
                aria-expanded={isOpen} 
                aria-label="目錄"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
            {isOpen && (
                <nav className="menu-dropdown">
                    <ul>
                        {menuItems.map((item, index) => (
                            <li 
                                key={item.id}
                                className={`${currentPage === item.id ? 'active' : ''} ${!item.unlocked ? 'disabled' : ''}`}
                                onClick={() => item.unlocked && handleNavigate(item.id)}
                            >
                                <span className="step-number">{index + 1}</span> {item.label}
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
};