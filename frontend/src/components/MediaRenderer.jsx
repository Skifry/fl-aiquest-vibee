import React from 'react';
import { ExternalLink, Play, Image as ImageIcon } from 'lucide-react';

const MediaRenderer = ({ type, mediaUrl, className = '' }) => {
  if (!mediaUrl || !type || type === 'text') {
    return null;
  }

  const renderMedia = () => {
    switch (type) {
      case 'video':
        return renderVideo(mediaUrl);
      case 'image':
        return renderImage(mediaUrl);
      case 'link':
        return renderLink(mediaUrl);
      default:
        return null;
    }
  };

  const renderVideo = (url) => {
    // Check if it's a YouTube URL and convert to embed format
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const youtubeMatch = url.match(youtubeRegex);
    
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      
      return (
        <div className="mt-3 mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Play className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Video Content</span>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full rounded-lg border border-gray-200"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Quest Video"
            />
          </div>
        </div>
      );
    }
    
    // For other video URLs, try to use HTML5 video element
    return (
      <div className="mt-3 mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <Play className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-600">Video Content</span>
        </div>
        <video
          src={url}
          controls
          className="w-full max-w-md rounded-lg border border-gray-200"
          style={{ maxHeight: '300px' }}
        >
          Your browser does not support the video tag.
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            View Video
          </a>
        </video>
      </div>
    );
  };

  const renderImage = (url) => {
    return (
      <div className="mt-3 mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <ImageIcon className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-gray-600">Image Content</span>
        </div>
        <img
          src={url}
          alt="Quest Image"
          className="max-w-full max-h-80 rounded-lg border border-gray-200 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div style={{ display: 'none' }} className="p-4 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Image could not be loaded.</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm">
            View Image
          </a>
        </div>
      </div>
    );
  };

  const renderLink = (url) => {
    return (
      <div className="mt-3 mb-3">
        <div className="flex items-center space-x-2 mb-2">
          <ExternalLink className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium text-gray-600">Link Content</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
        >
          <ExternalLink className="h-4 w-4 text-blue-600" />
          <span className="text-blue-600 font-medium">Open Link</span>
        </a>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderMedia()}
    </div>
  );
};

export default MediaRenderer;