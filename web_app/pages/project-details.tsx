// pages/project-details.tsx
const ProjectDetailsPage = () => {
  return (
      <div className="card">
          <h1>Project Details</h1>
          <h2>Proposed System</h2>
          <p>
              The proposed system is a web-based application that leverages advanced natural language
              processing and machine learning algorithms to analyze and interpret legal documents.
          </p>
          <h2>Objectives</h2>
          <ul>
              <li>Provide users with an easy-to-use interface for document upload.</li>
              <li>Generate concise summaries and answers to user-selected questions.</li>
              <li>Enhance users' understanding of legal documents.</li>
              <li>Reduce the time required to analyze lengthy contracts.</li>
          </ul>
          <h2>Scope</h2>
          <p>
              The scope of the project includes developing the web application, integrating with
              backend services for document processing, and ensuring user-friendly design and
              functionality.
          </p>
          <h2>Technologies Used</h2>
          <p>
              The project utilizes React for the frontend, Python for the backend, Flask for the web
              framework, and various libraries for natural language processing.
          </p>
      </div>
  );
};

export default ProjectDetailsPage;
