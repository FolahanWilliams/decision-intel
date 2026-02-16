'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Rendered when an error is caught. Receives the error and a reset callback. */
    fallback?: (error: Error, reset: () => void) => ReactNode;
    /** Optional section label shown in the default fallback UI. */
    sectionName?: string;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * React Error Boundary that prevents a single failing section from crashing
 * the entire page. Wrap each analysis panel in this component.
 *
 * @example
 * <ErrorBoundary sectionName="Bias Analysis">
 *   <BiasPanel data={data} />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(
            `[ErrorBoundary] ${this.props.sectionName ?? 'Unknown section'} crashed:`,
            error,
            info.componentStack,
        );
    }

    reset = () => {
        this.setState({ error: null });
    };

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        if (this.props.fallback) {
            return this.props.fallback(error, this.reset);
        }

        // Default fallback UI
        const sectionLabel = this.props.sectionName ?? 'This section';
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    {sectionLabel} encountered an error
                </h3>
                <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                    {error.message}
                </p>
                <button
                    onClick={this.reset}
                    className="mt-2 text-xs underline text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                    Try again
                </button>
            </div>
        );
    }
}
