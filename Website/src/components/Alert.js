'use client';

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Alert = ({ type = 'info', title, message, onClose }) => {
    const typeConfig = {
        success: {
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            textColor: 'text-green-800',
            iconColor: 'text-green-400',
            icon: CheckCircle
        },
        error: {
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-400',
            icon: AlertCircle
        },
        warning: {
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-400',
            icon: AlertCircle
        },
        info: {
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-400',
            icon: Info
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className={`rounded-md p-4 ${config.bgColor} ${config.borderColor} border`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>
                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className={`text-sm font-medium ${config.textColor}`}>
                            {title}
                        </h3>
                    )}
                    {message && (
                        <div className={`${title ? 'mt-2' : ''} text-sm ${config.textColor}`}>
                            {message}
                        </div>
                    )}
                </div>
                {onClose && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                onClick={onClose}
                                className={`inline-flex rounded-md p-1.5 ${config.textColor} hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Alert;