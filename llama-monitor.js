const natural = require('natural');
const { pipeline } = require('@xenova/transformers');
const axios = require('axios');

class LlamaMonitor {
    constructor(io) {
        this.io = io;
        this.tokenizer = new natural.WordTokenizer();
        this.model = null;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🦙 Initializing Llama model...');
            this.model = await pipeline('text-generation', 'TheBloke/Llama-2-7B-GGUF');
            console.log('✅ Llama model initialized successfully');
        } catch (error) {
            console.error('❌ Model initialization failed:', error);
        }
    }

    async analyzeContent(content) {
        if (!this.model) {
            console.error('Model not initialized');
            return;
        }

        try {
            const cleanContent = content.replace(/<[^>]*>/g, ' ').trim();
            if (!cleanContent) {
                console.warn('⚠️ No content to analyze');
                return;
            }

            
            console.log('📝 Analyzing content...');

            const prompt = `Given this document content: "${cleanContent.substring(0, 500)}"

            Generate 3 specific and actionable next steps to improve this document.
            Highlight any potential contradictions.
            Suggest relevant research articles or references.
            Format your response exactly as:
            NEXT_STEPS:
            - [detailed step 1]
            - [detailed step 2]
            - [detailed step 3]
            CONTRADICTIONS:
            - [contradiction 1]
            - [contradiction 2]
            REFERENCES:
            - [reference 1]
            - [reference 2]`;

            const result = await this.model(prompt, {
                max_new_tokens: 300,
                temperature: 0.7,
                top_p: 0.95
            });

            const insights = this.extractInsights(result[0].generated_text);
            console.log('Generated insights:', insights);

            if (insights.nextSteps.length > 0 || insights.contradictions.length > 0 || insights.references.length > 0) {
                this.io.emit('llama:insights', insights);
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        }
    }

    extractInsights(text) {
        const nextStepsSection = text.split('NEXT_STEPS:')[1] || '';
        const contradictionsSection = text.split('CONTRADICTIONS:')[1] || '';
        const referencesSection = text.split('REFERENCES:')[1] || '';

        const nextSteps = (nextStepsSection.match(/- .+/g) || []).map(item => item.replace('- ', '').trim()).slice(0, 3);
        const contradictions = (contradictionsSection.match(/- .+/g) || []).map(item => item.replace('- ', '').trim()).slice(0, 3);
        const references = (referencesSection.match(/- .+/g) || []).map(item => item.replace('- ', '').trim()).slice(0, 3);

        return { nextSteps, contradictions, references };
    }

    async generateStepContent(step, currentContent) {
        if (!this.model) {
            console.error('Model not initialized');
            return '';
        }

        try {
            const prompt = `Given this document content: "${currentContent.substring(0, 500)}"
            Generate detailed content for the following step: "${step}"`;

            const result = await this.model(prompt, {
                max_new_tokens: 200,
                temperature: 0.7,
                top_p: 0.95
            });

            return result[0].generated_text.trim();
        } catch (error) {
            console.error('Content generation failed:', error);
            return '';
        }
    }
}

module.exports = LlamaMonitor;