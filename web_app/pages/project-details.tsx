// pages/project-details.tsx
const ProjectDetailsPage = () => {
  return (
    <div className="card p-4 space-y-4">
      <h1 className="text-3xl font-bold">Project Details</h1>

      <h2 className="text-2xl font-semibold">Proposed System</h2>
      <p>
        JudicialSense is a web-based application designed to revolutionize the way legal documents are reviewed. By leveraging advanced NLP techniques, it provides concise summaries, sentiment analysis, and an interactive Q&A system, enabling users to extract key insights with minimal effort.
      </p>

      <h2 className="text-2xl font-semibold">Objectives</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>Create a user-friendly interface for seamless document upload and processing.</li>
        <li>Provide concise summaries to save time and improve comprehension.</li>
        <li>Implement an interactive Q&A module for in-depth document analysis.</li>
        <li>Integrate a real-time document viewer for better accessibility.</li>
      </ul>

      <h2 className="text-2xl font-semibold">Scope</h2>
      <p>
        The scope of JudicialSense encompasses the analysis of legal documents, primarily contracts, agreements, and policies. It supports multiple file formats including PDF and text files, offers sentiment analysis, and includes a powerful Q&A feature to aid in legal research.
      </p>

      <h2 className="text-2xl font-semibold">Features</h2>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Document Management:</strong> Upload, view, and manage legal documents with ease.</li>
        <li><strong>Automated Summarization:</strong> Generate concise summaries that highlight critical information.</li>
        <li><strong>Sentiment Analysis:</strong> Assess the tone and sentiment of contractual clauses.</li>
        <li><strong>Interactive Q&A:</strong> Extractive and generative models provide precise answers to user queries.</li>
        <li><strong>Sleek User Interface:</strong> Modern UI with smooth animations, transitions, and an intuitive layout.</li>
      </ul>

      <h2 className="text-2xl font-semibold">Technologies Used</h2>
      <ul className="list-disc list-inside space-y-2">
        <li><strong>Frontend:</strong> React with TypeScript, Tailwind CSS for styling, and Framer Motion for animations.</li>
        <li><strong>Backend:</strong> Python with Flask for robust server-side processing.</li>
        <li><strong>NLP Models:</strong> Transformer models like Legal-BERT for classification, BART for summarization, and RoBERTa for extractive Q&A.</li>
        <li><strong>OCR:</strong> PyTesseract for accurate text extraction from scanned documents.</li>
      </ul>

      <h2 className="text-2xl font-semibold">Conclusion</h2>
      <p>
        JudicialSense aims to enhance the efficiency and accuracy of legal document analysis. By automating tedious tasks and providing meaningful insights, it empowers legal professionals and individuals to navigate complex legal texts with confidence.
      </p>
    </div>
  );
};

export default ProjectDetailsPage;
