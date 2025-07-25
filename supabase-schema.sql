-- DocuSlicer Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE document_status AS ENUM ('uploading', 'processing', 'completed', 'failed');
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    storage_used BIGINT DEFAULT 0,
    storage_limit BIGINT DEFAULT 1073741824, -- 1GB for free plan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    status document_status DEFAULT 'uploading',
    metadata JSONB DEFAULT '{}',
    processing_results JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflows table
CREATE TABLE public.workflows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status workflow_status DEFAULT 'draft',
    configuration JSONB NOT NULL DEFAULT '{}',
    is_template BOOLEAN DEFAULT FALSE,
    template_category TEXT,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow executions table
CREATE TABLE public.workflow_executions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document shares table (for sharing documents)
CREATE TABLE public.document_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE,
    permissions TEXT[] DEFAULT '{"view"}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table (for API access)
CREATE TABLE public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage analytics table
CREATE TABLE public.usage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_document_shares_document_id ON public.document_shares(document_id);
CREATE INDEX idx_document_shares_token ON public.document_shares(share_token);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_created_at ON public.usage_analytics(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Workflows policies
CREATE POLICY "Users can view own workflows" ON public.workflows FOR SELECT USING (auth.uid() = user_id OR is_template = true);
CREATE POLICY "Users can insert own workflows" ON public.workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflows" ON public.workflows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workflows" ON public.workflows FOR DELETE USING (auth.uid() = user_id);

-- Workflow executions policies
CREATE POLICY "Users can view own workflow executions" ON public.workflow_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workflow executions" ON public.workflow_executions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflow executions" ON public.workflow_executions FOR UPDATE USING (auth.uid() = user_id);

-- Document shares policies
CREATE POLICY "Users can view shares for own documents" ON public.document_shares FOR SELECT USING (
    auth.uid() = shared_by OR 
    auth.uid() = shared_with OR 
    auth.uid() IN (SELECT user_id FROM public.documents WHERE id = document_id)
);
CREATE POLICY "Users can create shares for own documents" ON public.document_shares FOR INSERT WITH CHECK (
    auth.uid() = shared_by AND 
    auth.uid() IN (SELECT user_id FROM public.documents WHERE id = document_id)
);

-- API keys policies
CREATE POLICY "Users can view own API keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- Usage analytics policies
CREATE POLICY "Users can view own analytics" ON public.usage_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON public.usage_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default workflow templates
INSERT INTO public.workflows (id, user_id, name, description, status, configuration, is_template, template_category) VALUES
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'PDF Split and OCR', 'Split PDF into pages and extract text using OCR', 'active', '{"nodes":[{"id":"input","type":"input","label":"Input PDF","operation":"file-input","config":{"acceptedTypes":["pdf"]},"position":{"x":100,"y":100},"status":"idle","progress":0},{"id":"split","type":"process","label":"Split PDF","operation":"pdf-split","config":{"ranges":[{"start":1,"end":-1,"name":"page"}]},"position":{"x":300,"y":100},"status":"idle","progress":0},{"id":"ocr","type":"process","label":"Extract Text","operation":"ocr-extract","config":{"density":200},"position":{"x":500,"y":100},"status":"idle","progress":0}],"edges":[{"id":"e1","source":"input","target":"split"},{"id":"e2","source":"split","target":"ocr"}],"triggers":[{"id":"t1","type":"manual","config":{},"isActive":true}]}', true, 'document-processing'),
(uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'Document Merger', 'Merge multiple documents into a single PDF', 'active', '{"nodes":[{"id":"input","type":"input","label":"Input Documents","operation":"file-input","config":{"acceptedTypes":["pdf","doc","docx"],"multiple":true},"position":{"x":100,"y":100},"status":"idle","progress":0},{"id":"convert","type":"process","label":"Convert to PDF","operation":"convert-to-pdf","config":{},"position":{"x":300,"y":100},"status":"idle","progress":0},{"id":"merge","type":"process","label":"Merge PDFs","operation":"pdf-merge","config":{"order":"sequential"},"position":{"x":500,"y":100},"status":"idle","progress":0}],"edges":[{"id":"e1","source":"input","target":"convert"},{"id":"e2","source":"convert","target":"merge"}],"triggers":[{"id":"t1","type":"manual","config":{},"isActive":true}]}', true, 'document-processing');

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.documents IS 'Uploaded and processed documents';
COMMENT ON TABLE public.workflows IS 'Document processing workflows';
COMMENT ON TABLE public.workflow_executions IS 'Workflow execution history';
COMMENT ON TABLE public.document_shares IS 'Document sharing permissions';
COMMENT ON TABLE public.api_keys IS 'API access keys for users';
COMMENT ON TABLE public.usage_analytics IS 'User activity tracking';
