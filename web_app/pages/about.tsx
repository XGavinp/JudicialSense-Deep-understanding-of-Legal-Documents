// pages/about.tsx

const AboutPage = () => {
    return (
        <div className="card p-4 rounded-2xl shadow-md">
            <h1 className="text-3xl font-bold mb-4">About Us</h1>

            <h2 className="text-2xl font-semibold mt-4 mb-2">Problem Statement</h2>
            <p className="mb-4">
                The legal domain manages an extensive amount of textual information, including case laws, contracts, and judgments, which require thorough examination and precise interpretation. Traditionally, legal professionals manually review these documents, a process that is time-consuming, error-prone, and inefficient. As the volume of legal documents continues to grow, there is a critical need for automation to improve the productivity and accuracy of legal text processing.
            </p>

            <p className="mb-4">
                Recent advancements in intelligent automation (AI) and Natural Language Processing (NLP) have significantly improved the ability to process large volumes of text. Transformer-based models like BERT and its legal-specific variants show superior performance in document classification, entity recognition, summarization, and question answering. However, legal texts present unique challenges due to domain-specific terminology, complex sentence structures, and formal language, which limit the effectiveness of general-purpose NLP models.
            </p>

            <p className="mb-4">
                JudicialSense aims to address these challenges by developing a dedicated machine learning-driven system tailored for legal document analysis. By fine-tuning pre-trained transformer models on legal-specific datasets, including Legal-BERT for classification, BART for summarization, RoBERTa for extractive question answering, and FLAN-T5 for generative responses, the platform seeks to enhance the efficiency and effectiveness of legal text processing.
            </p>

            <h2 className="text-2xl font-semibold mt-4 mb-2">Objective</h2>
            <ul className="list-disc list-inside mb-4">
                <li>Automate the extraction of key contractual information, such as obligations, penalties, liabilities, and deadlines.</li>
                <li>Simplify complex legal language for better accessibility.</li>
                <li>Provide concise summaries and paraphrased explanations of lengthy contracts.</li>
                <li>Enable legal risk assessment by identifying ambiguous or unfavorable clauses.</li>
                <li>Implement a real-time question-answering system for context-aware responses.</li>
                <li>Enhance time and cost efficiency in legal document review.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-4 mb-2">Project Team Members</h2>
            <ul className="list-disc list-inside mb-4">
                <li>Devendra Kushwaha</li>
                <li>Gavin Pereira</li>
                <li>Prateeksha Sheregar</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-4 mb-2">Internal Guide</h2>
            <p className="mb-4">Dr. Feroz Sheikh</p>

            <h2 className="text-2xl font-semibold mt-4 mb-2">Technology Stack</h2>
            <ul className="list-disc list-inside mb-4">
                <li>Backend: Flask for processing and OCR-based text extraction using PyTesseract.</li>
                <li>Frontend: Next.js for an interactive user interface.</li>
                <li>Models: Legal-BERT for classification, BART for summarization, RoBERTa for extractive question answering, and FLAN-T5 for generative responses.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-4 mb-2">Impact</h2>
            <p>
                JudicialSense contributes to the legal AI landscape by enhancing the speed and accuracy of legal document review. By automating essential aspects of legal text processing, the platform reduces the workload of legal professionals, allowing them to focus on higher-level reasoning and decision-making.
            </p>
        </div>
    );
};

export default AboutPage;
