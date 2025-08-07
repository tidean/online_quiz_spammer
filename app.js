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

    // Load first question
    loadRandomQuestion();
}

function loadRandomQuestion() {
    if (currentQuestions.length === 0) {
        currentQuestions = [...questionsData[currentGrade]]; // Reload questions
    }

    // Pick random question
    const randomIndex = Math.floor(Math.random() * currentQuestions.length);
    const question = currentQuestions[randomIndex];

    // Remove question from available pool to avoid immediate repeats
    currentQuestions.splice(randomIndex, 1);

    // Display question
    questionNumber.textContent = `Question #${questionsAnswered + 1}`;
    questionText.innerHTML = question.question; // Use innerHTML to allow MathJax

    // Handle image if present
    if (question.image) {
        questionImg.src = question.image;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }

    // Clear previous state
    optionsContainer.innerHTML = '';
    selectedOption = null;
    feedback.style.display = 'none';
    submitBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';

    // Create option buttons
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = option; // Use innerHTML for MathJax in options
        optionElement.dataset.index = index;
        optionElement.addEventListener('click', () => selectOption(index));
        optionsContainer.appendChild(optionElement);
    });

    // Store current question for checking answer
    window.currentQuestion = question;

    // Render MathJax if present
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

    loadRandomQuestion();
}

function updateStats() {
    questionsAnsweredDisplay.textContent = questionsAnswered;
    correctAnswersDisplay.textContent = correctAnswers;
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    accuracyDisplay.textContent = accuracy + '%';
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', init);