<template>
    <div v-if="!isQuizStarted" class="quiz-title">{{questionData.title}}</div>
    <div v-else>
      <div v-if="!isQuizFinished" id="questionNumber" class="question-number">Question {{currentQuestion + 1}} / {{ totalQuestions }}</div>
      <div :class="{'result-title': isQuizFinished}">{{ question.title }} 
        <strong v-if="question.type === 'mutiplechoice-multiple'" title="mutiplechoice question">*</strong>
      </div>
      <img :src="question.imageSrc" alt="" />
      <p class="message" v-if="isQuizFinished">{{ this.message.text }}</p>
      <p class="message" v-else-if="message.isEnabled">{{ message.isAnswerCorrect ? 'Correct Answer' : 'Wrong Answer' }}</p>
      <div v-if="!isQuizFinished" id="answers" class="container-answers">
        <button 
          v-for="(ans, index) in question.answers"
          :key="question.type === 'truefalse' ? index : ans.a_id"
          :value="index"
          data-selected="false"
          :data-id="question.type === 'truefalse' ? !index : ans.a_id"
          @click="this.toggleAnswers"
          :class="[
            {correct: answer.isCorrect && answer.classNames[index]}, 
            {wrong: !answer.isCorrect && answer.classNames[index]}, 
            {active: isAnswerActive[index]}
          ]"
          class="answer-btn">{{ question.type !== 'truefalse' ? ans.caption : ans }}</button>
      </div>
      <div v-else class="score-message">Your score is {{ totalScore }} %</div>
    </div>
    <div class="conrtols" :class="{'start-ctl': !isQuizStarted}">
      <button v-if="!isQuizStarted && !isQuizFinished"
        @click="isQuizStarted = true" 
        class="tool-btn start">Start</button>
      <button v-else-if="isQuizStarted && !isQuizFinished"
        @click="setNextQuestion" 
        :disabled="isBtnDisabled"
        class="tool-btn">{{ (currentQuestion != (totalQuestions - 1)) ? 'Next' : 'Finish' }}</button>
      <button v-else
        @click="resetQuiz"
        class="tool-btn start">Play Again</button>
    </div>
</template>

<script>
export default {
  name: 'Question',
  data () {
    return {
      questionData: '',
      points: {
        player: 0,
        totalGame: 0
      },
      currentQuestion: 0,
      totalQuestions: null,
      question: {
        type: '',
        title: '',
        imageSrc: '',
        points: '',
        answers: []
      },
      isAnswerActive: [], //all answers indexing by loop 1-4
      previousAnswerIndex: null,
      message: {
        isEnabled: false,
        isAnswerCorrect: false,
        text: ''
      },
      answer: {
        classNames: [],
        isCorrect: false,
      },
      isBtnDisabled: true,
      isQuizFinished: false,
      isQuizStarted: false,
      totalScore: 0
    }
  },
  async created () {
    await this.fetchQuizData(false); //questions
    this.totalQuestions = this.questionData.questions.length;
    this.displayQuestion();
  },
  watch: {
    '$route': 'fetchQuizData'
  },
  computed: {

  },
  methods: {
    async fetchQuizData(isGameFinished) {
      const board = isGameFinished ? 'results' : 'questions';
      const baseUrl = 'https://apis-game-default-rtdb.europe-west1.firebasedatabase.app/apis-game-default-rtdb/';

      this.questionData = await fetch(baseUrl + board + '.json')
        .then(res => res.json())
        .then(res => res)
        .catch(e => console.error(e.message));
    },
    async setNextQuestion() {
      this.isBtnDisabled = true;
      const isCorrect = this.compareAnswers();
      this.addPoints(isCorrect);
      this.postMessage(isCorrect);
      this.displayCorrectAnswers(isCorrect);
      
      const isFinished = this.currentQuestion >= (this.totalQuestions - 1);
      await this.stopTime(isFinished);
    },
    displayQuestion() {
      // console.log(this.questionData);
      const questionIndex = this.questionData.questions[this.currentQuestion];
      this.question.type = questionIndex.question_type;
      this.question.title = questionIndex.title;
      this.question.imageSrc = require('@/assets/' + questionIndex.img);
      this.question.answers = (this.question.type === 'truefalse') 
        ? ['True', 'False'] 
        : questionIndex.possible_answers;
      this.question.points = questionIndex.points;
    },
    postMessage(isCorrect) {
      this.message.isEnabled = true;
      this.message.isAnswerCorrect = isCorrect;
    },
    addPoints(isCorrect) {
      if (isCorrect) {
        this.points.player += this.question.points;
      }
      this.points.totalGame += this.question.points;
      console.clear();
      console.table(this.points);
    },
    uncheckAnswers() {
      this.message.isEnabled = !this.message.isEnabled;
      this.message.isAnswerCorrect = false;
      this.isAnswerActive = [];
      this.previousAnswerIndex = null;
      this.answer.classNames = [];
      this.answer.isCorrect = false;
    },
    async stopTime(isFinished) {
      await setTimeout(() => {
        this.uncheckAnswers();
        if (!isFinished) {
          ++this.currentQuestion;
          this.displayQuestion();
        } else {
          this.setResults();
        }
      }, 3000);
    },
    toggleAnswers(e) {
      const isSelected = (e.target.getAttribute('data-selected') !== 'true');

      // toggle answers on one choice answer
      if (this.question.type !== 'mutiplechoice-multiple') {
        if (isSelected === false) return;
        
        if (this.previousAnswerIndex !== null) {
          const buttons = document.querySelectorAll('#answers button');
          buttons[this.previousAnswerIndex].setAttribute('data-selected', !isSelected);
          this.isAnswerActive[this.previousAnswerIndex] = !isSelected;
        }

        this.previousAnswerIndex = e.target.value;
      }

      e.target.setAttribute('data-selected', isSelected);
      this.isAnswerActive[e.target.value] = isSelected;
      this.isBtnDisabled = !this.isAnswerActive.includes(true);
      console.log(this.isAnswerActive);
    },
    compareAnswers() {
      if (this.question.type !== 'mutiplechoice-multiple') {
        const correctAnswer = this.questionData.questions[this.currentQuestion].correct_answer;
        const answerIndex = this.isAnswerActive.findIndex(el => el === true);

        if (this.question.type === 'truefalse') return !answerIndex == correctAnswer;
        return (this.question.answers[answerIndex].a_id === correctAnswer);
      }

      // case mutiplechoice-multiple below
      const correctAnswers = this.questionData.questions[this.currentQuestion].correct_answer;
      let sameAnswers = 0;
      const numberOfAnswered = this.isAnswerActive.filter(el => el === true).length;
      
      correctAnswers.forEach(ans => {
        this.isAnswerActive.map((el, index) => {
          if (el === true) {
            if (this.question.answers[index].a_id === ans) sameAnswers++;
          }

          return el;
        });
      });

      return (sameAnswers === correctAnswers.length) 
       && (numberOfAnswered === correctAnswers.length);
    },
    displayCorrectAnswers(isCorrect) {
      this.answer.isCorrect = isCorrect;
      const buttons = document.querySelectorAll('#answers button');
      let correctAnswers = [];

      if (this.question.type === 'mutiplechoice-multiple') {
        correctAnswers = this.questionData.questions[this.currentQuestion].correct_answer;
      } else {
        correctAnswers[0] = this.questionData.questions[this.currentQuestion].correct_answer;
      }

      buttons.forEach((button, index) => {
        correctAnswers.forEach(ans => {
          if (button.getAttribute('data-id') === String(ans)) {
            this.answer.classNames[index] = true;
          }
        });
      });
    },
    async setResults() {
      let results;
      try {
        results = Math.floor(this.points.player * 100 / this.points.totalGame);
      } catch (e) {
        console.log(e.message);
      }

      await this.fetchQuizData(true); //results
      this.displayResults(results);
    },
    displayResults(results) {
      this.isQuizFinished = true;
      
      const currentResult = this.questionData.results.find(el => 
        (results >= (el.minpoints - 1)) && (results <= el.maxpoints)
      );

      this.question.title = currentResult.title;
      this.message.text = currentResult.message;
      this.totalScore = results;
    },
    async resetQuiz() {
      this.isQuizFinished = false;
      this.message.isEnabled = false;
      this.currentQuestion = 0;
      await this.fetchQuizData(false); //questions
      this.displayQuestion();
    }
  },
}
</script>

<style lang="scss">
  @import "../app.scss";
</style>
