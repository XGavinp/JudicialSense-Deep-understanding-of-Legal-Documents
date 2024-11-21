from flask import Flask, request, jsonify
from textblob import TextBlob
from paraphrase import paraphrase
from predict import run_prediction
import json
from flask_cors import CORS
import PyPDF4  # Ensure this library is installed

app = Flask(__name__)
CORS(app)

def load_questions_short():
    questions_short = []
    try:
        with open('data/questions_short.txt', encoding="utf8") as f:
            questions_short = f.readlines()
    except Exception as e:
        print(f"Error loading questions: {e}")
    return [q.strip() for q in questions_short]

def getContractAnalysis(selected_response):
    if not selected_response:
        return "No answer found in document"
    
    blob = TextBlob(selected_response)
    polarity = blob.sentiment.polarity

    if polarity > 0:
        return "Positive"
    elif polarity < 0:
        return "Negative"
    else:
        return "Neutral"

questions_short = load_questions_short()

@app.route('/questionsshort')
def getQuestionsShort():
    return jsonify(questions_short)

@app.route('/contracts/', methods=["POST"])
def getContractResponse():
    try:
        file = request.files.get("file")
        question = request.form.get('question')

        if not file or not question:
            return jsonify({"error": "File and question must be provided."}), 400

        # Check if the uploaded file is a PDF or a text file
        if file.filename.endswith('.pdf'):
            pdf_reader = PyPDF4.PdfFileReader(file)
            paragraph = ""
            for page_num in range(pdf_reader.getNumPages()):
                page = pdf_reader.getPage(page_num)
                text = page.extractText()  # Fix: Use extractText() for PyPDF4
                if text:  # Only append non-empty text
                    paragraph += text + "\n"
        elif file.filename.endswith('.txt'):
            paragraph = file.read().decode("utf-8")
        else:
            return jsonify({"error": "Unsupported file type. Please upload a PDF or TXT file."}), 400

        if not paragraph or not question:
            return jsonify({"error": "Unable to process the document or question."}), 400

        predictions = run_prediction([question], paragraph, 'marshmellow77/roberta-base-cuad', n_best_size=5)

        answer_list = []
        with open("nbest.json", encoding="utf8") as jf:
            data = json.load(jf)
            for i in range(min(5, len(data['0']))):
                answer_list.append({
                    "answer": data['0'][i]['text'],
                    "probability": f"{round(data['0'][i]['probability'] * 100, 1)}%",
                    "analysis": getContractAnalysis(data['0'][i]['text'])
                })
        
        return jsonify(answer_list)

    except Exception as e:
        print(f"Error in getContractResponse: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/contracts/paraphrase/<path:selected_response>', methods=['GET'])
def getContractParaphrase(selected_response):
    if not selected_response:
        return jsonify({"error": "No answer found in document"}), 400
    
    paraphrases = paraphrase(selected_response)
    
    return jsonify(paraphrases)

@app.route('/get_response', methods=['POST'])
def get_response():
    question = request.form.get('selected_response')
    
    try:
        with open('responses.json', 'r') as file:
            responses = json.load(file)
            for response in responses:
                if response['question'] == question:
                    return jsonify({"answer": response['answer']})
        
        return jsonify({"error": "Response not found"}), 404
    
    except Exception as e:
        print(f"Error in get_response: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
