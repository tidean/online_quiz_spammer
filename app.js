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
        questionText.innerHTML = `Quiz complete!<br>Your score: ${accuracy}%<br><span style="font-size:1.3em;font-weight:bold;color:#4facfe;">${endMsg}</span>`;
        questionImage.style.display = 'block';
        questionImg.src = endImg;
        optionsContainer.innerHTML = '';
        submitBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        questionNumber.textContent = '';
        feedback.style.display = 'none';
        return;
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