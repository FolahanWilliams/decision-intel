'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createClientLogger } from '@/lib/utils/logger';

const log = createClientLogger('ErrorBoundary');

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
        log.error(
            `${this.props.sectionName ?? 'Unknown section'} crashed:`,
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
            <div className="rounded-lg border border-error/20 bg-error/5 p-4">
                <h3 className="text-sm font-semibold text-error">
                    {sectionLabel} encountered an error
                </h3>
                <p className="mt-1 text-xs text-error/80">
                    {error.message}
                </p>
                <button
                    onClick={this.reset}
                    className="mt-2 text-xs underline text-error/70 hover:text-error"
                >
                    Try again
                </button>
            </div>
        );
    }
}
