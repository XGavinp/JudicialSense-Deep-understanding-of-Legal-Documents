from flask import Flask, render_template, request, jsonify
from textblob import TextBlob
from paraphrase import paraphrase
from predict import run_prediction
import fitz  # PyMuPDF for PDF processing
from flask_cors import CORS
import json
app = Flask(__name__)
CORS(app)

# Load questions from a text file
def load_questions_short():
    questions_short = []
    with open('data/questions_short.txt', encoding="utf8") as f:
        questions_short = f.readlines()
    return [q.strip() for q in questions_short]

# Perform sentiment analysis on the selected response
def getContractAnalysis(selected_response):
    if selected_response == "":
        return "No answer found in document"
    else:
        blob = TextBlob(selected_response)
        polarity = blob.sentiment.polarity
        if polarity > 0:
            return "Positive"
        elif polarity < 0:
            return "Negative"
        else:
            return "Neutral"

# Load the questions at the start
questions_short = load_questions_short()

@app.route('/questionsshort')
def getQuestionsShort():
    return jsonify(questions_short)

# Endpoint to handle contract analysis
@app.route('/contracts/', methods=["POST"])
def getContractResponse():
    file = request.files["file"]
    question = request.form['question']

    if not file or not question:
        return jsonify({"error": "File and question must be provided."}), 400

    # Check file type and extract text
    if file.filename.endswith('.pdf'):
        doc = fitz.open(stream=file.read(), filetype="pdf")
        paragraph = ""
        for page in doc:
            paragraph += page.get_text()
        doc.close()
    elif file.filename.endswith('.txt'):
        paragraph = file.read().decode("utf-8")
    else:
        return jsonify({"error": "Unsupported file type. Please upload a PDF or TXT file."}), 400

    if not paragraph or not question:
        return jsonify({"error": "Unable to process the document or question."}), 400

    # Call run_prediction directly and return results
    try:
        predictions = run_prediction([question], paragraph, 'marshmellow77/roberta-base-cuad', n_best_size=5)

        if not predictions or not predictions[0]:
            return jsonify({"error": "No predictions found."}), 400

        answer_list = []
        for i in range(min(5, len(predictions[0]))):
            answer_text = predictions[0][i]['text']
            probability = predictions[0][i]['probability']
            analysis = getContractAnalysis(answer_text)

            answer_list.append({
                "answer": answer_text,
                "probability": f"{round(probability * 100, 1)}%",
                "analysis": analysis
            })

        return jsonify(answer_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to paraphrase a selected response
@app.route('/contracts/paraphrase/<path:selected_response>', methods=['GET'])
def getContractParaphrase(selected_response):
    if selected_response == "":
        return jsonify({"error": "No answer found in document"}), 400

    paraphrases = paraphrase(selected_response)
    return jsonify(paraphrases)

# Endpoint to retrieve a previously stored response
@app.route('/get_response', methods=['POST'])
def get_response():
    question = request.form['selected_response']
    
    try:
        with open('responses.json', 'r') as file:
            responses = json.load(file)
            for response in responses:
                if response['question'] == question:
                    return jsonify({"answer": response['answer']})
        
        return jsonify({"error": "Response not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
