import { useEffect, useState } from 'react';

const FileUpload: React.FC = () => {
  const [selectedResponse, setSelectedResponse] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/questionsshort'); // Endpoint to fetch questions
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleQuestionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQuestion(event.target.value);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Send the file and selected question to the Flask API
    const response = await fetch('http://127.0.0.1:5000/contracts', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.length > 0) {
      setSelectedResponse(data[0]?.answer || 'No answer found');
    } else {
      setSelectedResponse('No answer found');
    }
  };

  return (
    <div style={{ margin: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Contract Q&A</h1>
      <form onSubmit={handleFormSubmit} encType="multipart/form-data" style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          <span>Upload Contract:</span>
          <input type="file" name="file" required style={{ marginTop: '5px' }} />
        </label>
        <label style={{ display: 'block', marginBottom: '20px' }}>
          <span>Select Question:</span>
          <select name="question" onChange={handleQuestionSelect} required style={{ marginTop: '5px' }}>
            {questions.map((question, index) => (
              <option key={index} value={question}>
                {question}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="custom-btn btn-8" style={{ marginBottom: '20px' }}>
          Generate Response
        </button>
      </form>
      <div className="response-container" style={{ marginTop: '20px' }}>
        <h2>Response:</h2>
        <textarea value={selectedResponse} readOnly rows={10} placeholder="Generate Response..." style={{ width: '100%', marginTop: '10px' }} />
      </div>
    </div>
  );
};

export default FileUpload;
