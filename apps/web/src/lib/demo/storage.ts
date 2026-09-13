/**
 * Demo stand-in for Supabase Storage. Uploads live as in-memory object URLs for the
 * session; anything never uploaded resolves to a bundled sample document.
 */
const SAMPLE_DOCUMENT_URL = '/demo/sample-document.svg';
const objects = new Map<string, string>();

function objectKey(bucket: string, path: string): string {
  return `${bucket}/${path.replace(/^\/+/, '')}`;
}

function toBlob(file: unknown): Blob {
  if (file instanceof Blob) return file;
  if (file instanceof ArrayBuffer || ArrayBuffer.isView(file) || typeof file === 'string') {
    return new Blob([file as BlobPart]);
  }
  return new Blob([JSON.stringify(file ?? null)], { type: 'application/json' });
}

function bucketApi(bucket: string) {
  const urlFor = (path: string) => objects.get(objectKey(bucket, path)) ?? SAMPLE_DOCUMENT_URL;

  return {
    async upload(path: string, file: unknown) {
      const key = objectKey(bucket, path);
      const previous = objects.get(key);
      if (previous) URL.revokeObjectURL(previous);
      objects.set(key, URL.createObjectURL(toBlob(file)));
      return { data: { id: key, path, fullPath: key }, error: null };
    },
    async update(path: string, file: unknown) {
      return this.upload(path, file);
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: urlFor(path) } };
    },
    async createSignedUrl(path: string) {
      return { data: { signedUrl: urlFor(path) }, error: null };
    },
    async createSignedUrls(paths: string[]) {
      return {
        data: paths.map((path) => ({ path, signedUrl: urlFor(path), error: null })),
        error: null,
      };
    },
    async download(path: string) {
      const response = await fetch(urlFor(path));
      return { data: await response.blob(), error: null };
    },
    async remove(paths: string[]) {
      paths.forEach((path) => {
        const key = objectKey(bucket, path);
        const url = objects.get(key);
        if (url) URL.revokeObjectURL(url);
        objects.delete(key);
      });
      return { data: paths.map((name) => ({ name })), error: null };
    },
    async list() {
      return { data: [], error: null };
    },
  };
}

export function createDemoStorage() {
  return { from: bucketApi };
}
