export const getCDNUrlFromBucketPath = (path: string) => {
  // Split at second "/" to get the actual path
  const parts = path.split("/");
  const cleanPath = parts.slice(3).join("/");

  return `${process.env.NEXT_PUBLIC_CDN_URL}/video/${cleanPath}`;
};

export const makeCDNUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_CDN_URL}/video/${path}`;
};
