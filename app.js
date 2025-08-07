// App state
let currentGrade = null;
let currentQuestionIndex = 0;
let selectedOption = null;
let questionsAnswered = 0;
let correctAnswers = 0;
let currentQuestions = [];
let questionsData = {};

// DOM elements
const gradeButtons = document.querySelectorAll('.grade-btn');
const quizContainer = document.getElementById('quizContainer');
const questionCard = document.getElementById('questionCard');
const questionNumber = document.getElementById('questionNumber');
const currentGradeDisplay = document.getElementById('currentGrade');
const questionText = document.getElementById('questionText');
const questionImage = document.getElementById('questionImage');
const questionImg = document.getElementById('questionImg');
const optionsContainer = document.getElementById('optionsContainer');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const feedback = document.getElementById('feedback');
const questionsAnsweredDisplay = document.getElementById('questionsAnswered');
const correctAnswersDisplay = document.getElementById('correctAnswers');
const accuracyDisplay = document.getElementById('accuracy');
const questionCountSelect = document.getElementById('questionCountSelect');

let sessionQuestions = [];
let totalQuestionsInSession = 0;

// Load questions data from JSON file
async function loadQuestionsData() {
    try {
        const response = await fetch('data/question_bank.json');
        questionsData = await response.json();
        console.log('Questions loaded successfully');
    } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to sample data if JSON file not found
        questionsData = {
            3: [
                {
                    question: "What is 7 + 5?",
                    options: ["10", "11", "12", "13"],
                    correct: 2,
                    topic: "addition"
                },
                {
                    question: "What is 15 - 8?",
                    options: ["6", "7", "8", "9"],
                    correct: 1,
                    topic: "subtraction"
                }
            ],
            4: [
                {
                    question: "What is 24 ÷ 6?",
                    options: ["3", "4", "5", "6"],
                    correct: 1,
                    topic: "division"
                }
            ]
        };
    }
}

// Initialize the app
async function init() {
    await loadQuestionsData();

    // Event listeners
    gradeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const grade = btn.dataset.grade;
            selectGrade(grade);
        });
    });

    submitBtn.addEventListener('click', submitAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    if (questionCountSelect) {
        questionCountSelect.addEventListener('change', () => {
            if (currentGrade) {
                selectGrade(currentGrade);
            }
        });
    }
}

function selectGrade(grade) {
    currentGrade = grade;
    currentQuestions = [...questionsData[grade]]; // Copy questions

    // Update UI
    gradeButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-grade="${grade}"]`).classList.add('active');

    currentGradeDisplay.textContent = `Grade ${grade}`;
    quizContainer.classList.add('active');

    // Reset stats
    questionsAnswered = 0;
    correctAnswers = 0;
    updateStats();
    totalQuestionsInSession = parseInt(questionCountSelect.value, 10) || currentQuestions.length;
    sessionQuestions = pickRandomQuestions(currentQuestions, totalQuestionsInSession);
    currentQuestionIndex = 0;
    loadSessionQuestion();
}

function pickRandomQuestions(questionsArray, count) {
    const arr = [...questionsArray];
    const picked = [];
    for (let i = 0; i < count && arr.length > 0; i++) {
        const idx = Math.floor(Math.random() * arr.length);
        picked.push(arr[idx]);
        arr.splice(idx, 1);
    }
    return picked;
}

function loadSessionQuestion() {
    if (currentQuestionIndex >= sessionQuestions.length) {
        // Show score percentage when quiz is complete
        const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
        let endMsg = '';
        let endImg = '';
        if (accuracy >= 80) {
            endMsg = 'Very good!';
            endImg = 'images/good_job.jpg';
        } else if (accuracy >= 50) {
            endMsg = 'Keep it up!';
            endImg = 'images/keep_it_up.jpg';
        } else {
            endMsg = 'Try harder!';
            endImg = 'images/try_harder.jpg';
        }
        // Results screen
        questionText.innerHTML = `Quiz complete!<br>Your score: ${accuracy}%<br><span style=\"font-size:1.3em;font-weight:bold;color:#4facfe;\">${endMsg}</span>`;
        questionImage.style.display = 'block';
        questionImg.src = endImg;
        optionsContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        questionNumber.textContent = '';
        feedback.style.display = 'none';

        // Create results table
        let tableHtml = `<table id='resultsTable' style='width:100%;margin-top:30px;border-collapse:collapse;'>`;
        tableHtml += `<thead><tr style='background:#f8f9fa;'><th style='padding:10px;border:1px solid #eee;'>#</th><th style='padding:10px;border:1px solid #eee;'>Question</th><th style='padding:10px;border:1px solid #eee;'>Your Answer</th><th style='padding:10px;border:1px solid #eee;'>Correct Answer</th></tr></thead><tbody>`;
        sessionQuestions.forEach((q, i) => {
            let userAns = typeof q.userSelected !== 'undefined' ? q.options[q.userSelected] : '-';
            let correctAns = q.options[q.correct];
            let rowStyle = '';
            if (typeof q.userSelected !== 'undefined') {
                rowStyle = q.userSelected === q.correct ? 'background:#d4edda;' : 'background:#f8d7da;';
            }
            tableHtml += `<tr style='cursor:pointer;${rowStyle}' onclick='window.showReviewDetail(${i})'>`;
            tableHtml += `<td style='padding:10px;border:1px solid #eee;text-align:center;'>${i + 1}</td>`;
            tableHtml += `<td style='padding:10px;border:1px solid #eee;'>${q.question.replace(/<[^>]+>/g, '')}</td>`;
            tableHtml += `<td style='padding:10px;border:1px solid #eee;'>${userAns}</td>`;
            tableHtml += `<td style='padding:10px;border:1px solid #eee;'>${correctAns}</td>`;
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
        optionsContainer.innerHTML = tableHtml;

        // Add review detail area
        if (!document.getElementById('reviewDetail')) {
            const reviewDetail = document.createElement('div');
            reviewDetail.id = 'reviewDetail';
            reviewDetail.style.marginTop = '30px';
            quizContainer.appendChild(reviewDetail);
        } else {
            document.getElementById('reviewDetail').innerHTML = '';
        }

        // Add global function for showing review detail
        window.showReviewDetail = function (index) {
            const q = sessionQuestions[index];
            let html = `<div style='background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.08);padding:25px;'>`;
            html += `<h3 style='margin-bottom:15px;'>Question #${index + 1}</h3>`;
            html += `<div style='font-size:18px;margin-bottom:20px;'>${q.question}</div>`;
            if (q.image) {
                html += `<div style='text-align:center;margin-bottom:20px;'><img src='${q.image}' style='max-width:100%;max-height:250px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.08);'></div>`;
            }
            html += `<div style='margin-bottom:10px;'><strong>Your Answer:</strong> <span style='color:${q.userSelected === q.correct ? '#28a745' : '#dc3545'};'>${typeof q.userSelected !== 'undefined' ? q.options[q.userSelected] : '-'}</span></div>`;
            html += `<div style='margin-bottom:10px;'><strong>Correct Answer:</strong> <span style='color:#28a745;'>${q.options[q.correct]}</span></div>`;
            html += `<div style='margin-top:20px;'>`;
            q.options.forEach((opt, idx) => {
                let optStyle = 'padding:10px 18px;margin:5px 0;border-radius:8px;border:2px solid #e9ecef;display:block;';
                if (idx === q.correct) optStyle += 'background:#28a745;color:white;border-color:#28a745;';
                else if (idx === q.userSelected) optStyle += 'background:#dc3545;color:white;border-color:#dc3545;';
                html += `<span style='${optStyle}'>${opt}</span>`;
            });
            html += `</div></div>`;
            document.getElementById('reviewDetail').innerHTML = html;
            if (typeof MathJax !== 'undefined') {
                MathJax.typesetPromise([document.getElementById('reviewDetail')]).catch(() => { });
            }
        };
        return;
        // Show a question in review mode
        function showReviewQuestion(index) {
            if (!window.inReviewMode) return;
            const question = sessionQuestions[index];
            questionNumber.textContent = `Review: Question #${index + 1} of ${sessionQuestions.length}`;
            questionText.innerHTML = question.question;
            if (question.image) {
                questionImg.src = question.image;
                questionImage.style.display = 'block';
            } else {
                questionImage.style.display = 'none';
            }
            optionsContainer.innerHTML = '';
            question.options.forEach((option, idx) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.innerHTML = option;
                optionElement.dataset.index = idx;
                // Highlight correct/incorrect answers if answered
                if (typeof question.userSelected !== 'undefined') {
                    if (idx === question.correct) {
                        optionElement.classList.add('correct');
                    }
                    if (idx === question.userSelected && question.userSelected !== question.correct) {
                        optionElement.classList.add('incorrect');
                    }
                    if (idx === question.userSelected) {
                        optionElement.classList.add('selected');
                    }
                }
                optionsContainer.appendChild(optionElement);
            });
            feedback.style.display = 'none';
            submitBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            // Hide review image if not reviewing score
            questionImage.style.display = question.image ? 'block' : 'none';
            if (typeof MathJax !== 'undefined') {
                MathJax.typesetPromise([questionText, optionsContainer]).catch((err) => { });
            }
        }

        // Review navigation
        function reviewQuestion(delta) {
            if (!window.inReviewMode) return;
            window.reviewIndex += delta;
            if (window.reviewIndex < 0) window.reviewIndex = 0;
            if (window.reviewIndex >= sessionQuestions.length) window.reviewIndex = sessionQuestions.length - 1;
            showReviewQuestion(window.reviewIndex);
        }

        function exitReview() {
            window.inReviewMode = false;
            const reviewControls = document.getElementById('reviewControls');
            if (reviewControls) reviewControls.remove();
            // Optionally, reset to grade selection or quiz start
            quizContainer.classList.remove('active');
        }
    }
    const question = sessionQuestions[currentQuestionIndex];
    questionNumber.textContent = `Question #${currentQuestionIndex + 1} of ${sessionQuestions.length}`;
    questionText.innerHTML = question.question;
    if (question.image) {
        questionImg.src = question.image;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }
    optionsContainer.innerHTML = '';
    selectedOption = null;
    feedback.style.display = 'none';
    submitBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';
    // If this is the last question, change nextBtn text to 'Submit'
    if (currentQuestionIndex === sessionQuestions.length - 1) {
        nextBtn.textContent = 'Submit';
    } else {
        nextBtn.textContent = 'Next Question';
    }
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = option;
        optionElement.dataset.index = index;
        optionElement.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionElement);
    });
    window.currentQuestion = question;
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([questionText, optionsContainer]).catch((err) => console.log(err));
    }
}

function selectOption(index) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // Select new option
    selectedOption = index;
    document.querySelector(`[data-index="${index}"]`).classList.add('selected');
}

function submitAnswer() {
    if (selectedOption === null) {
        alert('Please select an answer first!');
        return;
    }

    const isCorrect = selectedOption === window.currentQuestion.correct;
    questionsAnswered++;
    // Save user's answer for review
    sessionQuestions[currentQuestionIndex].userSelected = selectedOption;

    if (isCorrect) {
        correctAnswers++;
        feedback.innerHTML = 'Correct! Well done! 🎉';
        feedback.className = 'feedback correct';
        document.querySelector(`[data-index="${selectedOption}"]`).classList.add('correct');
    } else {
        feedback.innerHTML = `Incorrect. The correct answer is: ${window.currentQuestion.options[window.currentQuestion.correct]}`;
        feedback.className = 'feedback incorrect';
        document.querySelector(`[data-index="${selectedOption}"]`).classList.add('incorrect');
        document.querySelector(`[data-index="${window.currentQuestion.correct}"]`).classList.add('correct');
    }

    feedback.style.display = 'block';

    // Render MathJax in feedback if present
    if (typeof MathJax !== 'undefined') {
        MathJax.typesetPromise([feedback]).catch((err) => console.log(err));
    }
    submitBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';

    // Disable option selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });

    updateStats();
}

function nextQuestion() {
    // Re-enable option selection
    document.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'auto';
    });
    currentQuestionIndex++;
    loadSessionQuestion();
}

function updateStats() {
    questionsAnsweredDisplay.textContent = questionsAnswered;
    correctAnswersDisplay.textContent = correctAnswers;
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    accuracyDisplay.textContent = accuracy + '%';
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);