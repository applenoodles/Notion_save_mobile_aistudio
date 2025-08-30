
import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This function will now run in the default Vercel Node.js runtime.
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Ensure the request is a POST request.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // The filename is passed as a query parameter.
  const filename = request.query.filename as string;

  if (!filename) {
    return response.status(400).json({ error: 'Missing filename query parameter' });
  }

  try {
    // The request object itself is a stream in the Node.js runtime.
    // We pass it directly to the `put` function.
    const blob = await put(filename, request, {
      access: 'public',
    });

    // Respond with the blob object, which includes the public URL.
    return response.status(200).json(blob);
  } catch (error: any) {
    console.error('Error uploading to Vercel Blob:', error);
    return response.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
}
