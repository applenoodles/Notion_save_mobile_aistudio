
import { put } from '@vercel/blob';
import type { NextRequest } from 'next/server';

// Vercel Edge Functions are fast and efficient for tasks like this.
export const config = {
  runtime: 'edge',
};

// The handler function for the /api/upload endpoint.
export default async function upload(request: NextRequest) {
  // The filename is passed as a query parameter.
  const filename = request.nextUrl.searchParams.get('filename');

  // Ensure the request body and filename are present.
  if (!filename || !request.body) {
    return new Response('Bad Request: Missing filename or request body.', {
      status: 400,
    });
  }

  try {
    // Upload the file to Vercel Blob.
    // The request.body is a readable stream of the file's contents.
    const blob = await put(filename, request.body, {
      access: 'public', // Make the file publicly accessible.
    });

    // Respond with the blob object, which includes the public URL.
    return new Response(JSON.stringify(blob), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    return new Response('Internal Server Error: Failed to upload file.', {
      status: 500,
    });
  }
}
