'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Renders markdown or plain text lesson content with proper formatting.
 * Supports: bold, italic, headings, bullet/numbered lists, code blocks, tables, links.
 */
export default function MarkdownContent({ content, className = '' }) {
    if (!content) return null;

    return (
        <div className={`prose prose-lg max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 mt-5 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700 ml-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700 ml-2">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700 leading-relaxed">{children}</li>,
                    code: ({ inline, children }) =>
                        inline
                            ? <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                            : <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto mb-4"><code className="text-sm font-mono">{children}</code></pre>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 bg-blue-50 py-2 rounded-r mb-4">{children}</blockquote>
                    ),
                    a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">{children}</a>
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto mb-4">
                            <table className="min-w-full border border-gray-200 rounded-lg">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => <th className="px-4 py-2 bg-gray-100 font-semibold text-gray-900 border-b border-gray-200 text-left">{children}</th>,
                    td: ({ children }) => <td className="px-4 py-2 text-gray-700 border-b border-gray-100">{children}</td>,
                    hr: () => <hr className="my-6 border-gray-200" />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
