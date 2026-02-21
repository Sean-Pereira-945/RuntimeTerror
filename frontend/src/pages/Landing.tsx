import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  FiShield,
  FiZap,
  FiGlobe,
  FiLock,
  FiTrendingUp,
  FiServer,
  FiArrowRight,
  FiGithub,
} from 'react-icons/fi';
import ParticleBackground from '../components/ParticleBackground';
import Globe3D from '../components/Globe3D';
import DarkModeToggle from '../components/DarkModeToggle';

/* ────── Data ────── */
const steps = [
  { num: '01', title: 'Upload Data Locally', desc: 'Clients upload their private datasets. Data never leaves their device.', icon: FiServer },
  { num: '02', title: 'Train on Your Device', desc: 'Each client trains the model locally. Only model updates are shared.', icon: FiZap },
  { num: '03', title: 'Aggregate Securely', desc: 'A central server combines updates to build a powerful global model.', icon: FiGlobe },
];

const features = [
  { icon: FiShield, title: 'Zero Data Sharing', desc: 'Raw data stays on the client device — always. Only encrypted gradients are transmitted.' },
  { icon: FiLock, title: 'End-to-End Privacy', desc: 'Differential privacy and secure aggregation ensure no client can be reverse-engineered.' },
  { icon: FiTrendingUp, title: 'Superior Accuracy', desc: 'Leverage diverse datasets across organizations for a model better than any single source.' },
  { icon: FiGlobe, title: 'Cross-Organization', desc: 'Hospitals, labs, and clinics collaborate without legal or regulatory data sharing barriers.' },
  { icon: FiZap, title: 'Real-Time Training', desc: 'Watch global model accuracy improve live as federated rounds complete.' },
  { icon: FiServer, title: 'Scalable Architecture', desc: 'Add unlimited clients seamlessly. The system scales horizontally across continents.' },
];

/* ────── Fade-in section wrapper ────── */
function Section({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ════════════════════════════════════ */
export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-white/70 backdrop-blur-xl dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-highlight-500 text-sm font-bold text-white">
              FL
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              FedLearn
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link
              to="/login"
              className="btn-primary !px-5 !py-2 text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header ref={heroRef} className="relative flex min-h-screen items-center overflow-hidden pt-16">
        {/* Particle BG */}
        <div className="absolute inset-0 z-0">
          <ParticleBackground particleCount={60} />
        </div>

        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-accent-500/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-40 h-[500px] w-[500px] rounded-full bg-highlight-500/20 blur-[120px]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2"
        >
          {/* Left — Text */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1.5 text-xs font-semibold text-accent-400">
                <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
                Federated Learning Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35 }}
              className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
            >
              Train AI{' '}
              <span className="gradient-text">Collaboratively</span>
              <br />
              Without Sharing Data
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-6 text-lg leading-relaxed text-slate-500 dark:text-slate-400"
            >
              FedLearn enables multiple organizations to collaboratively train a
              powerful sentiment analysis model while keeping all private data
              securely on their own devices. Zero data sharing. Maximum accuracy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link to="/login" className="btn-primary flex items-center gap-2 text-base">
                Get Started <FiArrowRight />
              </Link>
            </motion.div>
          </div>

          {/* Right — Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative hidden h-[500px] lg:block"
          >
            <Globe3D className="h-full w-full" />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <div className="h-10 w-6 rounded-full border-2 border-slate-400/30 flex items-start justify-center pt-2">
            <div className="h-2 w-1 rounded-full bg-accent-500 animate-pulse" />
          </div>
        </motion.div>
      </header>

      {/* ── How It Works ── */}
      <Section className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              Three simple steps to privacy-preserving collaborative AI
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="glass-card group relative p-8 text-center"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-highlight-500 text-2xl text-white shadow-lg shadow-accent-500/20 transition-transform duration-300 group-hover:scale-110">
                  <step.icon />
                </div>
                <span className="absolute right-6 top-6 font-display text-5xl font-bold text-slate-200/40 dark:text-slate-700/40">
                  {step.num}
                </span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>



      {/* ── Features ── */}
      <Section className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Why Federated Learning?
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              The privacy-first approach to building world-class AI models
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card group p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/10 text-xl text-accent-500 transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent-500/20">
                  <f.icon />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="relative z-10 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="glass-card overflow-hidden p-12 sm:p-16">
            <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-accent-500/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-highlight-500/10 blur-[80px]" />
            <h2 className="relative font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Ready to Train{' '}
              <span className="gradient-text">Collaboratively</span>?
            </h2>
            <p className="relative mt-4 text-lg text-slate-500 dark:text-slate-400">
              Join the federation and contribute to a global sentiment analysis model
              — your data never leaves your device.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/login" className="btn-primary flex items-center gap-2 text-base">
                Get Started <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-200/50 py-8 dark:border-slate-800/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-slate-400">
            &copy; 2026 FedLearn. Privacy-first federated learning.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 transition hover:text-accent-500"
            >
              <FiGithub className="text-lg" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}