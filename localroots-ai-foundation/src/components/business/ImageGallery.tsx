interface ImageGalleryProps {
  images: string[];
  name: string;
}

/** First image large, the rest as a grid. Shows a placeholder when there are no images. */
export default function ImageGallery({ images, name }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
        No photos yet
      </div>
    );
  }

  const [first, ...rest] = images;
  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- URLs will come from Supabase Storage */}
      <img src={first} alt={`${name} photo 1`} className="h-72 w-full rounded-2xl object-cover sm:h-96" />
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rest.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- URLs will come from Supabase Storage
            <img
              key={src}
              src={src}
              alt={`${name} photo ${i + 2}`}
              loading="lazy"
              className="h-32 w-full rounded-xl object-cover sm:h-40"
            />
          ))}
        </div>
      )}
    </div>
  );
}
