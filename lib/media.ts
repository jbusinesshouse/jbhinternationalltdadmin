export function mainImage(
  images: { image_url: string; is_main: boolean | null }[] | null | undefined
): string | null {
  if (!images?.length) return null;
  return (images.find((i) => i.is_main) ?? images[0]).image_url;
}
