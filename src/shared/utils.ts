import { ApproachConfig, ApproachType } from './types';

export const approachConfigs: Record<ApproachType, ApproachConfig> = {
  chatgpt: {
    title: 'ChatGPT',
    description: 'Simple document upload and search using OpenAI APIs directly. Files are uploaded to OpenAI, automatically added to a vector store, and searchable via natural language queries using the Assistants API.',
    features: [
      'Direct OpenAI Files API integration',
      'Automatic vector store indexing',
      'Natural language search via Assistants API',
      'Static chunking strategy (800 tokens, 400 overlap)',
      'No local file storage - cloud-only approach'
    ]
  },
  pinecone: {
    title: 'Pinecone',
    description: 'Advanced document processing with the new OpenAI Responses API. Features flexible structured data extraction, custom prompts, and JSON schema validation for precise document analysis.',
    features: [
      'OpenAI Responses API integration',
      'Flexible structured data extraction',
      'Custom extraction prompts',
      'JSON schema validation',
      'Multi-modal processing (text + images)',
      'Advanced document classification'
    ]
  },
  custom: {
    title: 'Custom',
    description: 'Fully customizable document processing pipeline with advanced features and integrations. Combine multiple AI models and custom logic for specialized use cases.',
    features: [
      'Custom processing pipelines',
      'Multiple AI model integration',
      'Advanced workflow automation',
      'Custom embedding strategies',
      'Specialized document classification',
      'Extensible plugin architecture'
    ]
  }
};

export function getApproachConfig(approach: ApproachType): ApproachConfig {
  return approachConfigs[approach];
}