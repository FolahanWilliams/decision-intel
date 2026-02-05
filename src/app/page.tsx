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

// Font config to match design
ChartJS.defaults.font.family = "'Inter', sans-serif";

const CHART_COLORS = {
    teal: '#0D9488',
    tealTrans: 'rgba(13, 148, 136, 0.6)',
    tealSolid: 'rgba(13, 148, 136, 0.8)',
    tealLight: 'rgba(13, 148, 136, 0.2)',
    orange: '#F97316',
    orangeTrans: 'rgba(249, 115, 22, 0.6)',
    stone: '#78716C',
    stoneTrans: 'rgba(120, 113, 108, 0.6)',
};

// --- 2. HELPERS ---

// Box-Muller transform for normal distribution
function generateScatterData(count: number, meanX: number, meanY: number, stdDev: number) {
    const data = [];
    for (let i = 0; i < count; i++) {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const z2 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);

        data.push({
            x: meanX + (z * stdDev),
            y: meanY + (z2 * stdDev)
        });
    }
    return data;
}

const wrapLabel = (str: string, maxLen = 16) => {
    if (str.length <= maxLen) return str;
    const words = str.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxLen) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
};

// --- 3. COMPONENTS ---

export default function LandingPage() {
    // --- STATE: Interactive Primer ---
    const [scatterMode, setScatterMode] = useState<'noise' | 'bias' | 'optimized'>('noise');
    const [scatterData, setScatterData] = useState<{ x: number; y: number }[]>([]);

    useEffect(() => {
        // Generate initial data (client-side only to avoid hydration mismatch)
        // eslint-disable-next-line
        setScatterData(generateScatterData(50, 50, 50, 20));
    }, []);

    const updateScatter = (mode: 'noise' | 'bias' | 'optimized') => {
        setScatterMode(mode);
        if (mode === 'noise') {
            setScatterData(generateScatterData(50, 50, 50, 20)); // Wide spread
        } else if (mode === 'bias') {
            setScatterData(generateScatterData(50, 75, 75, 5)); // Tight, off-center
        } else {
            setScatterData(generateScatterData(50, 50, 50, 3)); // Tight, centered
        }
    };

    const getScatterExplanation = () => {
        switch (scatterMode) {
            case 'noise':
                return {
                    text: "Decisions scatter widely. The average is correct, but individual reliability is low.",
                    border: "border-stone-400"
                };
            case 'bias':
                return {
                    text: "Consistent, but consistently wrong. Everyone agrees, but they are all missing the target.",
                    border: "border-orange-500"
                };
            case 'optimized':
                return {
                    text: "NeuroAudit reduces noise and corrects bias, leading to consistent, accurate outcomes.",
                    border: "border-teal-500"
                };
        }
    };

    const scatterExplanation = getScatterExplanation();

    // --- STATE: Calculator ---
    const [calcVolume, setCalcVolume] = useState(1200);
    const [calcValue, setCalcValue] = useState(50000);

    const estimatedLoss = (calcVolume * calcValue) * 0.10;
    const formattedLoss = estimatedLoss >= 1000000
        ? `$${(estimatedLoss / 1000000).toFixed(1)}M`
        : `$${(estimatedLoss / 1000).toFixed(0)}k`;


    return (
        <div className="min-h-screen bg-[#FAFAF9] text-[#44403C] font-sans selection:bg-teal-100 selection:text-teal-900">

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-stone-800 tracking-tight">Neuro<span className="text-teal-600">Audit</span></span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <Link href="#concept" className="text-stone-500 hover:text-teal-600 text-sm font-medium transition-colors">The Concept</Link>
                            <Link href="#dashboard" className="text-stone-500 hover:text-teal-600 text-sm font-medium transition-colors">Audit Results</Link>
                            <Link href="#process" className="text-stone-500 hover:text-teal-600 text-sm font-medium transition-colors">How It Works</Link>
                            <Link href="/dashboard" className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 transition-colors">
                                Launch App
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-16 pb-12 sm:pt-24 sm:pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight mb-6">
                        Detect the Invisible <br />
                        <span className="text-teal-600">Cost of Noise.</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-stone-500">
                        A decision-intelligence platform that quantifies neurocognitive bias and inconsistency inside your organization using AI.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link href="#concept" className="bg-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:bg-teal-700 transition-colors">
                            Explore the Platform
                        </Link>
                        <Link href="#dashboard" className="bg-white text-stone-700 border border-stone-200 px-6 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors">
                            View Sample Audit
                        </Link>
                    </div>
                </div>
            </header>

            {/* SECTION 1: The Concept (Interactive Primer) */}
            <section id="concept" className="py-16 bg-white border-y border-stone-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 text-center max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold text-stone-900 mb-4">Bias is Systematic. Noise is Random.</h2>
                        <p className="text-stone-500">
                            Most organizations focus on Bias (errors in one direction), but ignore Noise (random scatter).
                            Use the simulation below to understand how <strong>Decision Noise</strong> affects your bottom line.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        {/* Controls / Narrative */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white border border-stone-200 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.02)] rounded-xl p-6 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-200">
                                <h3 className="font-semibold text-lg text-stone-800 mb-2">Select a Scenario:</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => updateScatter('noise')}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all group focus:ring-2 focus:ring-teal-500 focus:outline-none ${scatterMode === 'noise' ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-stone-200 hover:border-teal-500 hover:bg-teal-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`font-medium ${scatterMode === 'noise' ? 'text-teal-700' : 'text-stone-700 group-hover:text-teal-700'}`}>High Noise</span>
                                            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded group-hover:bg-white">Common</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1">High variance. Correct average, but widely scattered.</p>
                                    </button>

                                    <button
                                        onClick={() => updateScatter('bias')}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all group focus:ring-2 focus:ring-orange-500 focus:outline-none ${scatterMode === 'bias' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-stone-200 hover:border-orange-500 hover:bg-orange-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`font-medium ${scatterMode === 'bias' ? 'text-orange-700' : 'text-stone-700 group-hover:text-orange-700'}`}>Systemic Bias</span>
                                            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded group-hover:bg-white">Dangerous</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1">Low variance, but consistently wrong.</p>
                                    </button>

                                    <button
                                        onClick={() => updateScatter('optimized')}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all group focus:ring-2 focus:ring-teal-500 focus:outline-none ${scatterMode === 'optimized' ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-stone-200 hover:border-teal-500 hover:bg-teal-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className={`font-medium ${scatterMode === 'optimized' ? 'text-teal-700' : 'text-stone-700 group-hover:text-teal-700'}`}>AI Optimized</span>
                                            <span className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded group-hover:bg-white">Goal</span>
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1">NeuroAudit framework reduces both bias and noise.</p>
                                    </button>
                                </div>
                            </div>
                            <div className={`text-sm text-stone-500 italic border-l-4 pl-4 py-1 ${scatterExplanation.border}`}>
                                <strong>{scatterMode === 'noise' ? 'High Noise:' : scatterMode === 'bias' ? 'Systemic Bias:' : 'Optimized:'}</strong> {scatterExplanation.text}
                            </div>
                        </div>

                        {/* Visualization */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border border-stone-200 shadow-sm rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-stone-700">Decision Outcome Visualization</h3>
                                    <span className="text-xs text-stone-400">Target Value = 50</span>
                                </div>
                                <div className="relative w-full h-[300px] md:h-[350px]">
                                    <Scatter
                                        data={{
                                            datasets: [
                                                {
                                                    label: 'Decisions',
                                                    data: scatterData,
                                                    backgroundColor: scatterMode === 'noise' ? CHART_COLORS.stoneTrans : scatterMode === 'bias' ? CHART_COLORS.orangeTrans : CHART_COLORS.tealSolid,
                                                    borderColor: scatterMode === 'noise' ? CHART_COLORS.stone : scatterMode === 'bias' ? CHART_COLORS.orange : CHART_COLORS.teal,
                                                    borderWidth: 1,
                                                    pointRadius: 5,
                                                },
                                                {
                                                    label: 'Target',
                                                    data: [{ x: 50, y: 50 }],
                                                    backgroundColor: '#E7E5E4',
                                                    pointRadius: 15,
                                                    pointHoverRadius: 15,
                                                }
                                            ]
                                        }}
                                        options={{
                                            maintainAspectRatio: false,
                                            scales: {
                                                x: { min: 0, max: 100, grid: { display: false }, ticks: { display: false } },
                                                y: { min: 0, max: 100, grid: { display: false }, ticks: { display: false } }
                                            },
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: { enabled: false }
                                            },
                                            animation: {
                                                duration: 1000,
                                                easing: 'easeOutQuart'
                                            }
                                        }}
                                    />
                                </div>
                                <div className="mt-4 flex justify-center gap-6 text-sm text-stone-500">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${scatterMode === 'noise' ? 'bg-stone-500' : scatterMode === 'bias' ? 'bg-orange-500' : 'bg-teal-500'}`}></span> Decisions
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-stone-300"></span> Target
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 2: The Audit Dashboard */}
            <section id="dashboard" className="py-16 bg-stone-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <span className="text-teal-600 font-semibold tracking-wide uppercase text-sm">Case Study</span>
                        <h2 className="text-3xl font-bold text-stone-900 mt-2">Sample Organizational Audit</h2>
                        <p className="text-stone-500 mt-4 max-w-2xl">
                            We audited 1,200 loan applications and strategic documents. The data revealed a
                            <strong>55% variance</strong> in expert judgment on identical cases, costing an estimated <strong>$3B+</strong> annually.
                        </p>
                    </div>

                    {/* Key Metrics Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[
                            { val: '12.5x', label: 'ROI', sub: 'Return on investment', color: 'text-teal-600' },
                            { val: '+34%', label: 'Consistency', sub: 'Process alignment', color: 'text-stone-800' },
                            { val: '-22%', label: 'Risk Exposure', sub: 'Bad debt reduction', color: 'text-orange-500' }
                        ].map((metric, i) => (
                            <div key={i} className="bg-white border border-stone-100 rounded-xl p-6 flex flex-col items-center text-center shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all">
                                <span className={`text-4xl font-bold ${metric.color} mb-1`}>{metric.val}</span>
                                <span className="text-sm font-medium text-stone-600 uppercase tracking-wider">{metric.label}</span>
                                <p className="text-xs text-stone-400 mt-2">{metric.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Detailed Visuals Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Radar Chart: Biases */}
                        <div className="bg-white border border-stone-100 rounded-xl p-6 shadow-sm">
                            <div className="mb-4 border-b border-stone-100 pb-4">
                                <h3 className="font-bold text-lg text-stone-800">Prevalent Cognitive Biases</h3>
                                <p className="text-sm text-stone-500">Frequency of biases detected in text audits.</p>
                            </div>
                            <div className="relative w-full h-[300px] md:h-[350px]">
                                <Radar
                                    data={{
                                        labels: ["Confirmation Bias", "Anchoring Effect", "Sunk Cost", "Halo Effect", "Availability", "Groupthink"].map(l => wrapLabel(l)),
                                        datasets: [{
                                            label: 'Detected Frequency',
                                            data: [85, 92, 45, 60, 75, 50],
                                            fill: true,
                                            backgroundColor: CHART_COLORS.tealLight,
                                            borderColor: CHART_COLORS.teal,
                                            pointBackgroundColor: CHART_COLORS.teal,
                                            pointBorderColor: '#fff',
                                            pointHoverBackgroundColor: '#fff',
                                            pointHoverBorderColor: CHART_COLORS.teal
                                        }]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            r: {
                                                angleLines: { color: '#E7E5E4' },
                                                grid: { color: '#E7E5E4' },
                                                pointLabels: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#57534E' },
                                                ticks: { display: false }
                                            }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Histogram: Noise */}
                        <div className="bg-white border border-stone-100 rounded-xl p-6 shadow-sm">
                            <div className="mb-4 border-b border-stone-100 pb-4">
                                <h3 className="font-bold text-lg text-stone-800">Judgment Variance (Noise)</h3>
                                <p className="text-sm text-stone-500">Distribution of valuations via different underwriters.</p>
                            </div>
                            <div className="relative w-full h-[300px] md:h-[350px]">
                                <Bar
                                    data={{
                                        labels: ["-30% Undervalued", "-15%", "Correct Value", "+15%", "+30% Overvalued"].map(l => wrapLabel(l)),
                                        datasets: [{
                                            label: '% of Decisions',
                                            data: [15, 25, 30, 20, 10],
                                            backgroundColor: ['#D6D3D1', '#A8A29E', '#0D9488', '#A8A29E', '#D6D3D1'],
                                            borderRadius: 4
                                        }]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: { beginAtZero: true, grid: { color: '#F5F5F4' }, ticks: { color: '#78716C' } },
                                            x: { grid: { display: false }, ticks: { color: '#78716C' } }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3: The Process */}
            <section id="process" className="py-16 bg-white border-y border-stone-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-stone-900">How NeuroAudit Works</h2>
                        <p className="text-stone-500 mt-4 max-w-2xl mx-auto">
                            Our AI engine ingests unstructured data to turn decision patterns into actionable insights.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { icon: '📄', title: '1. Ingest', desc: 'Connects to emails, CRM notes, and documents.' },
                            { icon: '🧠', title: '2. Scan', desc: 'AI agents detect linguistic markers of bias.' },
                            { icon: '⚖️', title: '3. Audit', desc: 'Compare against historical baselines to quantify noise.' },
                            { icon: '🔔', title: '4. Nudge', desc: 'Real-time prompts to reconsider judgments.' }
                        ].map((step, i) => (
                            <div key={i} className="bg-white border border-stone-200 rounded-xl p-6 relative group hover:bg-stone-50 transition-colors shadow-sm">
                                <div className="text-4xl mb-4 text-teal-600 opacity-80 group-hover:opacity-100 transition-opacity">{step.icon}</div>
                                <h3 className="font-bold text-stone-800 mb-2">{step.title}</h3>
                                <p className="text-sm text-stone-500">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 4: Calculator */}
            <section className="py-16 bg-stone-900 text-stone-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-white">Calculate Your Noise Cost</h2>
                        <p className="text-stone-400 mt-2">
                            Research suggests noise costs organizations roughly 10% of total decision value per year.
                        </p>
                    </div>

                    <div className="bg-stone-800 rounded-xl p-8 border border-stone-700 shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Inputs */}
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Annual Decision Volume</label>
                                    <input
                                        type="range"
                                        min="100" max="10000" step="100"
                                        value={calcVolume}
                                        onChange={(e) => setCalcVolume(Number(e.target.value))}
                                        className="w-full accent-teal-600 h-1 bg-stone-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-stone-500 mt-2">
                                        <span>100</span>
                                        <span className="text-teal-400 font-bold">{calcVolume.toLocaleString()}</span>
                                        <span>10k</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-stone-300 mb-2">Avg. Value per Decision ($)</label>
                                    <input
                                        type="range"
                                        min="1000" max="1000000" step="1000"
                                        value={calcValue}
                                        onChange={(e) => setCalcValue(Number(e.target.value))}
                                        className="w-full accent-teal-600 h-1 bg-stone-600 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs text-stone-500 mt-2">
                                        <span>$1k</span>
                                        <span className="text-teal-400 font-bold">${calcValue.toLocaleString()}</span>
                                        <span>$1M</span>
                                    </div>
                                </div>
                            </div>

                            {/* Output */}
                            <div className="flex flex-col justify-center items-center bg-stone-900 rounded-lg border border-stone-700 p-6">
                                <span className="text-stone-400 text-sm uppercase tracking-widest mb-2">Estimated Annual Loss</span>
                                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{formattedLoss}</div>
                                <p className="text-xs text-stone-500 text-center">Based on conservative 10% noise variance model.</p>
                                <button className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded transition-colors text-sm font-medium">
                                    Download Full Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-stone-50 border-t border-stone-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <span className="text-xl font-bold text-stone-800 tracking-tight">Neuro<span className="text-teal-600">Audit</span></span>
                        <p className="text-sm text-stone-500 mt-1">Consistency is the new competitive advantage.</p>
                    </div>
                    <div className="flex gap-6 text-sm text-stone-500">
                        <a href="#" className="hover:text-stone-800 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-stone-800 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-stone-800 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
