import { StarIcon, StarHalfIcon } from "./icons";

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (rating >= i) return <StarIcon key={i} size={size} fill="currentColor" />;
        if (rating >= i - 0.5) return <StarHalfIcon key={i} size={size} />;
        return <StarIcon key={i} size={size} />;
      })}
    </span>
  );
}
