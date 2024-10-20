import { useEffect, useState } from 'react';

const IndexPage = () => {
    const [responses, setResponses] = useState<{ question: string; answer: string }[]>([]);
    const [questions, setQuestions] = useState<string[]>([]);
    const [selectedQuestion, setSelectedQuestion] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/questionsshort');
            const data = await response.json();
            setQuestions(data);
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleQuestionSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedQuestion(event.target.value);
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || !selectedQuestion) return;

        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('question', selectedQuestion);

        try {
            const response = await fetch('http://127.0.0.1:5000/contracts', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (data.length > 0) {
                // Add new response to the state
                setResponses((prevResponses) => [
                    ...prevResponses,
                    { question: selectedQuestion, answer: data[0]?.answer || 'No answer found' },
                ]);
            } else {
                setResponses((prevResponses) => [
                    ...prevResponses,
                    { question: selectedQuestion, answer: 'No answer found' },
                ]);
            }
        } catch (error) {
            console.error('Error fetching response:', error);
            setResponses((prevResponses) => [
                ...prevResponses,
                { question: selectedQuestion, answer: 'Error fetching response' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ margin: '20px' }}>
            <h1 style={{ marginBottom: '20px' }}>Contract Review Chat</h1>

            <div className="responses-container" style={{ marginBottom: '20px' }}>
                {responses.map((response, index) => (
                    <div key={index} className="response">
                        <strong>Q:</strong> {response.question}<br />
                        <strong>A:</strong> {response.answer}
                    </div>
                ))}
                
                {/* Display loading dots when fetching response */}
                {isLoading && (
                    <div className="loading dots">Generating response...</div>
                )}
            </div>

            <form onSubmit={handleFormSubmit} encType="multipart/form-data" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                    <span>Upload Contract:</span>
                    <input type="file" name="file" accept=".pdf,.txt" onChange={handleFileChange} required style={{ marginTop: '5px' }} />
                </label>
                <label style={{ display: 'block', marginBottom: '20px' }}>
                    <span>Select Question:</span>
                    <select name="question" onChange={handleQuestionSelect} required style={{ marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', padding: '10px' }}>
                        {questions.map((question, index) => (
                            <option key={index} value={question}>
                                {question}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="submit" className="custom-btn" disabled={isLoading}>
                    {isLoading ? 'Generating Response...' : 'Generate Response'}
                </button>
            </form>
        </div>
    );
};

export default IndexPage;