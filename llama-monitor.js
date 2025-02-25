const natural = require('natural');
const transformers = require('@xenova/transformers');

class LlamaMonitor {
    constructor(io) {
        this.io = io;
        this.tokenizer = new natural.WordTokenizer();
        this.lastAnalysis = Date.now();
        this.analysisDelay = 2000;
        this.model = null;
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🦙 Initializing model...');
            this.model = await transformers.pipeline('text-generation', 'Xenova/distilgpt2');
            console.log('✅ Model initialized');
        } catch (error) {
            console.error('❌ Model initialization failed:', error);
        }
    }

    async analyzeContent(content) {
        console.log('shit works');
        if (!this.model) return;
        
        try {
            const cleanContent = content.replace(/<[^>]*>/g, ' ').trim();
            if (!cleanContent) return;

            console.log('📝 Analyzing content...');

            const prompt = `Given this document content: "${cleanContent.substring(0, 500)}"

            Suggest 3 specific improvements or next steps to enhance this document.
            Format as:
            NEXT_STEPS:
            - [specific improvement]
            - [specific improvement]
            - [specific improvement]`;

            const result = await this.model(prompt, {
                max_new_tokens: 150,
                temperature: 0.7
            });

            const nextSteps = this.extractSteps(result[0].generated_text);
            console.log('Generated steps:', nextSteps);
            
            if (nextSteps.length > 0) {
                this.io.emit('llama:insights', { nextSteps });
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        }
    }

    async generateStepContent(step) {
        if (!this.model) return null;

        try {
            const prompt = `Create detailed content for this improvement: "${step}"
            Make it specific and actionable.
            Keep it under 200 words.`;

            const result = await this.model(prompt, {
                max_new_tokens: 200,
                temperature: 0.7
            });

            return result[0].generated_text.trim();
        } catch (error) {
            console.error('Step generation failed:', error);
            return null;
        }
    }

    extractSteps(text) {
        const stepsSection = text.split('NEXT_STEPS:')[1] || '';
        const items = stepsSection.match(/- .+/g) || [];
        return items
            .map(item => item.replace('- ', '').trim())
            .filter(step => step.length > 0)
            .slice(0, 3);
    }
}

module.exports = LlamaMonitor;