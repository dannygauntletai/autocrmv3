import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  fileId: string;
}

serve(async (req) => {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasOpenAIKey: !!openaiKey
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!openaiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Initialize clients
    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    // Parse request
    const requestText = await req.text();
    console.log('Raw request body:', requestText);

    if (!requestText) {
      throw new Error('Request body is empty');
    }

    const { fileId } = JSON.parse(requestText) as RequestBody;
    console.log('Parsed fileId:', fileId);

    if (!fileId) {
      throw new Error('File ID is required');
    }

    // Fetch file information
    const { data: file, error: fileError } = await supabaseClient
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError) {
      console.error('Error fetching file:', fileError);
      throw new Error(`File not found: ${fileError.message}`);
    }

    if (!file) {
      throw new Error('File not found in database');
    }

    console.log('Found file:', { filename: file.filename, size: file.size, type: file.file_type });

    // Download file content
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('team_documents')
      .download(file.bucket_path);

    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error('No file data received from storage');
    }

    // Get file content as text
    const fileContent = await fileData.text();

    // Sanitize content by removing null bytes and invalid characters
    const sanitizedContent = fileContent
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove invalid Unicode
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Replace non-printable chars with space

    // Split content into chunks of roughly 1000 characters
    const chunkSize = 1000
    const overlap = 200
    const chunks: string[] = []
    let currentIndex = 0

    while (currentIndex < sanitizedContent.length) {
      // Find a good break point near the chunk size
      let endIndex = Math.min(currentIndex + chunkSize, sanitizedContent.length)
      if (endIndex < sanitizedContent.length) {
        // Try to break at a period, newline, or space
        const breakPoint = sanitizedContent.substring(endIndex - 50, endIndex).search(/[.\n ]/)
        if (breakPoint !== -1) {
          endIndex = endIndex - 50 + breakPoint + 1
        }
      }
      
      chunks.push(sanitizedContent.substring(currentIndex, endIndex).trim())
      currentIndex = Math.max(endIndex - overlap, currentIndex + 1)
    }

    // Process non-empty chunks
    const nonEmptyChunks = chunks.filter(chunk => chunk.length > 0)

    console.log(`Processing ${nonEmptyChunks.length} chunks`)

    // Generate embeddings for each chunk
    for (const chunk of nonEmptyChunks) {
      try {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk
        })

        const [{ embedding }] = embeddingResponse.data

        // Store the embedding
        console.log('Attempting to store embedding for chunk:', {
          fileId,
          chunkIndex: chunks.indexOf(chunk),
          contentLength: chunk.length,
          hasEmbedding: !!embedding
        });

        const { data: insertData, error: insertError } = await supabaseClient
          .from('file_embeddings')
          .insert({
            file_id: fileId,
            chunk_index: chunks.indexOf(chunk),
            content: chunk,
            embedding,
            metadata: {
              total_chunks: chunks.length
            }
          });

        if (insertError) {
          console.error('Error inserting embedding:', {
            error: insertError,
            fileId,
            chunkIndex: chunks.indexOf(chunk)
          });
          throw insertError;
        }

        console.log('Successfully stored embedding:', {
          fileId,
          chunkIndex: chunks.indexOf(chunk),
          insertData
        });
      } catch (error) {
        console.error('Error generating embedding for chunk:', error)
        throw error
      }
    }

    return new Response(
      JSON.stringify({
        message: `Successfully processed ${nonEmptyChunks.length} chunks from file`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : 'Unknown',
    });

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}); 