'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

/**
 * ChatInput - Modern, clean message input with paper plane button
 * 
 * Features:
 * - Clean white bar with shadow-lg
 * - Circular blue paper plane button
 * - Auto-focus on mount
 * - RTL support
 * - Smooth animations
 * - Senior-friendly large input
 */
export default function ChatInput({
    onSend,
    disabled = false,
    autoFocus = true
}) {
    const { t, isRTL } = useLanguage();
    const [message, setMessage] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim() || disabled) return;
        
        onSend(message.trim());
        setMessage('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const isEmpty = !message.trim();

    return (
        <div className="p-4 bg-white border-t border-slate-100">
            <form 
                onSubmit={handleSubmit} 
                className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
                {/* Input container with shadow */}
                <motion.div 
                    className={`flex-1 relative ${isFocused ? 'scale-[1.01]' : ''} transition-transform duration-200`}
                    animate={{ scale: isFocused ? 1.01 : 1 }}
                >
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder={t('typeMessage')}
                        disabled={disabled}
                        autoFocus={autoFocus}
                        className={`
                            w-full bg-white border-2 text-slate-800 
                            text-lg font-medium rounded-full 
                            px-6 py-4 outline-none transition-all duration-200
                            placeholder:text-slate-400 placeholder:font-medium
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isFocused 
                                ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                                : 'border-slate-200 shadow-md shadow-slate-200/50 hover:border-slate-300'
                            }
                        `}
                        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                    />
                </motion.div>

                {/* Send button - Circular blue paper plane */}
                <motion.button
                    type="submit"
                    disabled={isEmpty || disabled}
                    whileHover={{ scale: isEmpty ? 1 : 1.05 }}
                    whileTap={{ scale: isEmpty ? 1 : 0.95 }}
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center
                        transition-all duration-200 shadow-lg
                        ${isEmpty || disabled
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-slate-200/50'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30 hover:shadow-blue-600/50'
                        }
                    `}
                >
                    <Send className={`w-6 h-6 ${isRTL ? '-scale-x-100' : ''}`} />
                </motion.button>
            </form>
        </div>
    );
}
