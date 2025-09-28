'use client';

import { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

export default function VideoPlayer({ videoUrl, title }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState(false);

    if (!videoUrl) {
        return null;
    }

    // Extract video ID from different URL formats
    const getVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return match && match[2].length === 11 ? match[2] : null;
    };

    // Convert various YouTube URL formats to embed format
    const getEmbedUrl = (url) => {
        if (url.includes('youtube.com/embed/')) {
            return url;
        }

        const videoId = getVideoId(url);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
        }

        // For other video platforms, return as is
        return url;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    if (error) {
        return (
            <div className="w-full bg-gray-100 rounded-lg p-8 text-center">
                <div className="flex flex-col items-center">
                    <RotateCcw className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Video Unavailable</h3>
                    <p className="text-gray-600 mb-4">
                        The video content is currently unavailable. Please try again later.
                    </p>
                    <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Watch on External Site
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                <iframe
                    src={embedUrl}
                    title={title || 'Lesson Video'}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={() => setError(true)}
                />
            </div>

            {/* Custom Video Controls Info */}
            <div className="bg-gray-900 text-white p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <Play className="h-4 w-4" />
                            <span>Use video controls to play, pause, and adjust settings</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4 text-gray-400" />
                        <Maximize className="h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Alternative simple video player for non-YouTube videos
export function SimpleVideoPlayer({ videoUrl, title }) {
    if (!videoUrl) return null;

    return (
        <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
            <video
                className="w-full h-auto"
                controls
                preload="metadata"
                style={{ maxHeight: '400px' }}
            >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/ogg" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
}