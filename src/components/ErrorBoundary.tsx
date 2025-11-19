import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-6 flex flex-col items-center justify-center min-h-[200px] bg-red-50 rounded-lg border border-red-100 text-center">
                    <div className="bg-red-100 p-3 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Възникна грешка
                    </h3>
                    <p className="text-sm text-red-600 max-w-md mb-4">
                        {this.state.error?.message || 'Нещо се обърка при зареждането на този компонент.'}
                    </p>
                    <Button
                        variant="outline"
                        className="bg-white hover:bg-red-50 border-red-200 text-red-700"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Опитай отново
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
