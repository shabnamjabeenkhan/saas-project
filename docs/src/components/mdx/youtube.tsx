'use client';

import React from 'react';

export function YouTube({ id }: { id: string }) {
  return (
    <div className="aspect-video w-full my-6">
      <iframe
        className="w-full h-full rounded-lg"
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

