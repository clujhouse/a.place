declare module "mime-db" {
  interface MimeEntry {
    source?: string;
    extensions?: string[];
    compressible?: boolean;
    charset?: string;
  }

  const mimeDb: Record<string, MimeEntry>;
  export default mimeDb;
}
