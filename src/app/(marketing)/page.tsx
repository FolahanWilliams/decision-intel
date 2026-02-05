"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    LinearScale,
    CategoryScale,
    BarElement,
    Title
} from 'chart.js';
import { Scatter, Radar, Bar } from 'react-chartjs-2';

// --- 1. CONFIG & REGISTRATION ---

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    LinearScale,
    CategoryScale,
    BarElement,
    Title
);

ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.color = "#78716C";

const COLORS = {
    teal: '#0D9488',
    tealTrans: 'rgba(13, 148, 136, 0.6)',
    tealSolid: 'rgba(13, 148, 136, 0.9)',
    tealLight: 'rgba(13, 148, 136, 0.1)',
    indigo: '#4F46E5',
    stone: '#78716C',
    stoneLight: '#E7E5E4',
    bg: '#FAFAF9'
};

// --- DATA GENERATORS ---

function generateScatterData(count: number, meanX: number, meanY: number, stdDev: number) {
    const data = [];
    for (let i = 0; i < count; i++) {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const z2 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
        data.push({ x: meanX + (z * stdDev), y: meanY + (z2 * stdDev) });
    }
    return data;
}

export default function PremiumLanding() {
    // --- STATE ---
    const [scatterMode, setScatterMode] = useState<'status_quo' | 'neuroaudit'>('status_quo');
    const [scatterData, setScatterData] = useState<{ x: number; y: number }[]>([]);

    // Calculator State
    const [calcPop, setCalcPop] = useState(5000); // decisions/year
    const [calcVal, setCalcVal] = useState(15000); // avg value
    const [calcSavings, setCalcSavings] = useState(0);

    useEffect(() => {
        // Hydration safe random data
        // eslint-disable-next-line
        updateScatter('status_quo');
    }, []);

    useEffect(() => {
        // Noise Cost = Volume * Value * 10% (conservative estimate of noise tax)
        setCalcSavings((calcPop * calcVal) * 0.125); // 12.5% ROI per prompt
    }, [calcPop, calcVal]);

    const updateScatter = (mode: 'status_quo' | 'neuroaudit') => {
        setScatterMode(mode);
        if (mode === 'status_quo') {
            // High noise + bias (off center, spread out)
            setScatterData(generateScatterData(60, 40, 60, 25));
        } else {
            // Precise (centered, tight)
            setScatterData(generateScatterData(60, 50, 50, 4));
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 font-sans selection:bg-teal-100 selection:text-teal-900">

            {/* HERO SECTION */}
            <header className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium tracking-wide">
                    New: AI-Powered Bias Detection Engine
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-stone-900 mb-8 leading-[1.1]">
                    The Invisible Tax <br /> on Your Decisions.
                </h1>
                <p className="text-xl md:text-2xl text-stone-500 max-w-3xl mx-auto mb-12 font-light leading-relaxed">
                    Cognitive noise and bias cost organizations <span className="text-stone-800 font-semibold">billions</span> in margin.
                    Standardize your judgment with <span className="text-teal-600 font-semibold">NeuroAudit</span>.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
                    <Link href="/dashboard" className="px-8 py-4 bg-teal-600 text-white rounded-lg font-semibold text-lg shadow-lg shadow-teal-900/10 hover:bg-teal-700 transition-all hover:-translate-y-0.5">
                        Launch Audit Platform
                    </Link>
                    <a href="#demo" className="px-8 py-4 bg-white text-stone-600 border border-stone-200 rounded-lg font-medium text-lg hover:bg-stone-50 transition-colors">
                        View Interactive Demo
                    </a>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-stone-200">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-stone-900 mb-1">$3B+</div>
                        <div className="text-sm text-stone-500 uppercase tracking-widest">Industry Loss</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-teal-600 mb-1">12.5x</div>
                        <div className="text-sm text-stone-500 uppercase tracking-widest">Audit ROI</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-stone-900 mb-1">60%</div>
                        <div className="text-sm text-stone-500 uppercase tracking-widest">Noise Reduction</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-600 mb-1">24/7</div>
                        <div className="text-sm text-stone-500 uppercase tracking-widest">Real-time Analysis</div>
                    </div>
                </div>
            </header>

            {/* INTERACTIVE SCATTER (THE PROBLEM) */}
            <section id="demo" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-4">
                            <h2 className="text-3xl font-bold text-stone-900 mb-6">Visualizing the Problem.<br /><span className="text-stone-400">Bias is easy to see. Noise is not.</span></h2>
                            <p className="text-stone-500 mb-8 text-lg leading-relaxed">
                                When experts judge identical cases, their decisions scatter. This variance is <strong>Decision Noise</strong>.
                                It is invisible, expensive, and ubiquitous.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => updateScatter('status_quo')}
                                    className={`p-4 text-left rounded-xl border transition-all ${scatterMode === 'status_quo' ? 'bg-stone-50 border-stone-400 ring-1 ring-stone-400' : 'bg-white border-stone-200 hover:border-stone-300'}`}
                                >
                                    <div className="font-semibold text-stone-900">The Status Quo</div>
                                    <div className="text-sm text-stone-500 mt-1">Wide variance. High Error. Expensive.</div>
                                </button>
                                <button
                                    onClick={() => updateScatter('neuroaudit')}
                                    className={`p-4 text-left rounded-xl border transition-all ${scatterMode === 'neuroaudit' ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-stone-200 hover:border-teal-200'}`}
                                >
                                    <div className="font-semibold text-teal-800">The NeuroAudit Standard</div>
                                    <div className="text-sm text-teal-600 mt-1">Tight consistency. Machine precision.</div>
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <div className="bg-stone-50 rounded-2xl p-8 border border-stone-100 shadow-sm relative h-[500px]">
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full bg-stone-300"></span>
                                    <span className="text-xs text-stone-400 uppercase tracking-wider font-medium">Target Decision (50,50)</span>
                                </div>
                                <Scatter options={{
                                    maintainAspectRatio: false,
                                    scales: { x: { display: false, min: 0, max: 100 }, y: { display: false, min: 0, max: 100 } },
                                    plugins: { legend: { display: false } },
                                    animation: { duration: 800, easing: 'easeOutQuart' }
                                }} data={{
                                    datasets: [
                                        {
                                            data: scatterData,
                                            backgroundColor: scatterMode === 'status_quo' ? 'rgba(120, 113, 108, 0.5)' : COLORS.tealSolid,
                                            pointRadius: 6,
                                            pointHoverRadius: 8
                                        },
                                        { data: [{ x: 50, y: 50 }], pointRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' } // Bullseye
                                    ]
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AUDIT INTELLIGENCE (THE EVIDENCE) */}
            <section className="py-24 bg-stone-50 border-t border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-stone-900 mb-4">Deep Forensic Analysis</h2>
                        <p className="text-stone-500 text-lg">Our AI engine dissects every decision into its cognitive components, revealing hidden patterns of error.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Radar Chart */}
                        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-stone-800">Cognitive Footprint</h3>
                                <p className="text-sm text-stone-500">Breakdown of specific biases detected in your workflow.</p>
                            </div>
                            <div className="h-[350px]">
                                <Radar options={{
                                    maintainAspectRatio: false,
                                    scales: { r: { ticks: { display: false }, grid: { color: COLORS.stoneLight } } },
                                    plugins: { legend: { display: false } }
                                }} data={{
                                    labels: ['Anchoring', 'Sunk Cost', 'Confirmation', 'Overconfidence', 'Availability', 'Framing'],
                                    datasets: [{
                                        data: [80, 45, 90, 60, 30, 75],
                                        backgroundColor: COLORS.tealLight,
                                        borderColor: COLORS.teal,
                                        borderWidth: 2,
                                    }]
                                }} />
                            </div>
                        </div>

                        {/* Histogram */}
                        <div className="bg-white p-8 rounded-2xl border border-stone-100 shadow-sm">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-stone-800">Judgment Variance</h3>
                                <p className="text-sm text-stone-500">Distribution of outcomes vs optimal baseline.</p>
                            </div>
                            <div className="h-[350px]">
                                <Bar options={{
                                    maintainAspectRatio: false,
                                    scales: { y: { display: false }, x: { grid: { display: false } } },
                                    plugins: { legend: { display: false } }
                                }} data={{
                                    labels: ['-20%', '-10%', 'Optimal', '+10%', '+20%'],
                                    datasets: [{
                                        data: [15, 30, 45, 25, 10],
                                        backgroundColor: [COLORS.stoneLight, COLORS.stoneLight, COLORS.teal, COLORS.stoneLight, COLORS.stoneLight],
                                        borderRadius: 4
                                    }]
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI PROCESS (THE SOLUTION) */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16">
                        <span className="text-indigo-600 font-bold tracking-wider uppercase text-sm">The Engine</span>
                        <h2 className="text-4xl font-bold text-stone-900 mt-2">From Unstructured Data to Strategy.</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { title: '1. Ingest', icon: '📥', desc: 'Securely upload PDFs, emails, and CRM notes.' },
                            { title: '2. Scan', icon: '🔎', desc: 'LLMs detect linguistic markers of bias.' },
                            { title: '3. Audit', icon: '⚖️', desc: 'Compare against historical & peer baselines.' },
                            { title: '4. Nudge', icon: '💡', desc: 'Real-time prompts to correct judgment.' }
                        ].map((step, i) => (
                            <div key={i} className="group p-8 bg-white border border-stone-200 rounded-xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5 transition-all duration-300">
                                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{step.icon}</div>
                                <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
                                <p className="text-stone-500 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALCULATOR (PERSONALIZATION) */}
            <section className="py-32 bg-stone-900 text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">Calculate Your Savings.</h2>
                            <p className="text-stone-400 text-lg mb-12">
                                Noise isn&apos;t just annoying—it&apos;s expensive. See how much consistency could save your bottom line.
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <label className="flex justify-between text-sm font-medium text-stone-300 mb-4">
                                        <span>Annual Decisions</span>
                                        <span className="text-teal-400">{calcPop.toLocaleString()}</span>
                                    </label>
                                    <input type="range" min="100" max="50000" step="100" value={calcPop} onChange={e => setCalcPop(Number(e.target.value))} className="w-full accent-teal-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                                <div>
                                    <label className="flex justify-between text-sm font-medium text-stone-300 mb-4">
                                        <span>Avg. Value per Decision</span>
                                        <span className="text-teal-400">${calcVal.toLocaleString()}</span>
                                    </label>
                                    <input type="range" min="1000" max="100000" step="1000" value={calcVal} onChange={e => setCalcVal(Number(e.target.value))} className="w-full accent-teal-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-stone-800 p-10 rounded-2xl border border-stone-700 text-center">
                            <div className="text-stone-400 uppercase tracking-widest text-sm font-medium mb-4">Projected Annual Savings</div>
                            <div className="text-6xl font-bold text-white mb-2">
                                ${(calcSavings / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-teal-400 text-sm font-medium mb-8">+12.5% Efficiency Gain</div>
                            <Link href="/dashboard" className="block w-full py-4 bg-white text-stone-900 font-bold rounded-lg hover:bg-stone-100 transition-colors">
                                Start Your Audit
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-stone-50 py-16 border-t border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                    <div className="text-lg font-bold text-stone-900 tracking-tight">Neuro<span className="text-teal-600">Audit</span></div>
                    <div className="flex gap-8 text-sm text-stone-500 mt-4 md:mt-0">
                        <a href="#" className="hover:text-stone-900">Privacy</a>
                        <a href="#" className="hover:text-stone-900">Security</a>
                        <a href="#" className="hover:text-stone-900">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
