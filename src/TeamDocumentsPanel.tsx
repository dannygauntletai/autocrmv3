import { useState, useRef, useEffect } from 'react';
import { FileUp, Trash2, Download, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';

interface TeamDocument {
  id: string;
  filename: string;
  file_type: string;
  size: number;
  uploaded_by: string;
  team_id: string;
  created_at: string;
  description: string;
  bucket_path: string;
}

export const TeamDocumentsPanel = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch team ID for the current supervisor
  useEffect(() => {
    const fetchTeamId = async () => {
      if (!user) return;

      // First check if the user is a supervisor
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, role')
        .eq('email', user.email)
        .single();

      if (employeeError) {
        setError('Failed to fetch employee information');
        return;
      }

      if (employeeData.role !== 'supervisor') {
        setError('Only supervisors can access team documents');
        return;
      }

      // Then get their team
      const { data: teamData, error: teamError } = await supabase
        .from('employee_teams')
        .select('team_id')
        .eq('employee_id', employeeData.id)
        .single();

      if (teamError) {
        setError('Failed to fetch team information');
        return;
      }

      if (teamData) {
        setTeamId(teamData.team_id);
        fetchDocuments(teamData.team_id);
      }
    };

    fetchTeamId();
  }, [user]);

  // Fetch team documents
  const fetchDocuments = async (tid: string) => {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('team_id', tid)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to fetch documents');
      return;
    }

    setDocuments(data || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !teamId) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${teamId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('team_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Create file record in the database
      const { data: fileRecord, error: fileError } = await supabase
        .from('files')
        .insert({
          filename: file.name,
          file_type: fileExt || 'unknown',
          size: file.size,
          description: description,
          team_id: teamId,
          bucket_path: filePath,
          uploaded_by: user?.id
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // 3. Generate embeddings (this will be handled by an edge function)
      const { error: embeddingError } = await supabase.functions
        .invoke('generate-file-embeddings', {
          body: { fileId: fileRecord.id }
        });

      if (embeddingError) {
        console.error('Warning: Failed to generate embeddings:', embeddingError);
      }

      // 4. Refresh documents list
      await fetchDocuments(teamId);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: TeamDocument) => {
    if (!teamId) return;

    try {
      // 1. Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('team_documents')
        .remove([doc.bucket_path]);

      if (storageError) throw storageError;

      // 2. Delete file record (this will cascade to embeddings)
      const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', doc.id);

      if (deleteError) throw deleteError;

      // 3. Refresh documents list
      await fetchDocuments(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const getFileUrl = async (doc: TeamDocument) => {
    const { data } = await supabase.storage
      .from('team_documents')
      .createSignedUrl(doc.bucket_path, 3600); // 1 hour expiry

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Team Documents</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage documents for your team. These documents will be used to enhance AI-generated responses.
          </p>
        </div>

        {/* Upload Section */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Document Description
              </label>
              <textarea
                id="description"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter a description of the document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <label className="block">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={uploading}
                />
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileUp className="h-4 w-4 mr-2" />
                      Upload Document
                    </>
                  )}
                </button>
              </label>
            </div>
            {error && (
              <div className="mt-2 text-sm text-red-600 flex items-center bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-b-lg">
              <div className="mx-auto w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                <FileUp className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm">No documents uploaded yet.</p>
              <p className="text-xs mt-1 text-gray-400">Upload documents to enhance AI responses for your team.</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{doc.filename}</h3>
                    {doc.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{doc.description}</p>
                    )}
                    <div className="mt-1 flex items-center text-xs text-gray-400 space-x-2">
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{(doc.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => getFileUrl(doc)}
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2 text-red-400 hover:text-red-500 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => handleDelete(doc)}
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 