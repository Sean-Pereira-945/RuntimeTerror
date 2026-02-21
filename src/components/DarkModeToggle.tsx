import { motion } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

export default function DarkModeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl glass-card flex items-center justify-center transition-colors duration-300 hover:bg-white/10"
      aria-label="Toggle dark mode"
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? (
          <FiMoon className="w-5 h-5 text-accent-300" />
        ) : (
          <FiSun className="w-5 h-5 text-amber-400" />
        )}
      </motion.div>
    </button>
  );
}
