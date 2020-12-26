<template>
  <div class="container">
    <div class="hide">
      <div v-if="!isQuizFinished" id="questionNumber" class="question-number">Question {{currentQuestion + 1}} / {{ totalQuestions }}</div>
      <div :class="isQuizFinished ? 'result-title' : ''">{{ question.title }} 
        <strong v-if="question.type === 'mutiplechoice-multiple'" title="mutiplechoice question">*</strong>
      </div>
      <img :src="question.imageSrc" alt="" />
      <p class="message" v-if="!isQuizFinished && message.isEnabled">{{ this.message.isAnswerCorrect ? 'Correct Answer' : 'Wrong Answer' }}</p>
      <p class="message" v-else>{{ this.message.text }}</p>
      <div  v-if="!isQuizFinished" id="answers" class="container-answers">
        <button 
          v-for="(ans, index) in question.answers"
          :key="ans.a_id"
          :value="index"
          data-selected="false"
          :data-id="ans.a_id"
          @click="this.toggleAnswers"
          :class="[answer.classNames[index] ? answer.classNames[index] : '', {active: isAnswerActive[index]}]"
          class="answer-btn btn">{{ question.type !== 'truefalse' ? ans.caption : ans }}</button>
      </div>
      <div v-else class="score-message">Your score is {{ totalScore }} %</div>
    </div>
    <div v-if="!isQuizFinished" class="conrtols">
      <button 
        @click="setNextQuestion" 
        :disabled="isBtnDisabled"
        class="next-btn btn">{{ (currentQuestion != (totalQuestions - 1)) ? 'Next' : 'Finish' }}</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
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
        classNames: []
      },
      isBtnDisabled: true,
      isQuizFinished: false,
      totalScore: 0
    }
  },
  async created () {
    await this.fetchQuizData(false); //questions
    this.totalQuestions = this.questionData.questions.length;
    this.displayQuestion();
  },
  // watch: {
  //   '$route': 'fetchQuizData'
  // },
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

      if (isFinished) {
        let results;
        try {
          results = Math.floor(this.points.player * 100 / this.points.totalGame);
        } catch (e) {
          console.log(e.message);
        }

        await this.fetchQuizData(true); //results
        this.displayResults(results);
      }
    },
    displayQuestion() {
      // console.log(this.questionData);
      const questionIndex = this.questionData.questions[this.currentQuestion];
      this.question.type = questionIndex.question_type;
      this.question.title = questionIndex.title;
      this.question.imageSrc = require('./assets/' + questionIndex.img);
      this.question.answers = (this.question.type === 'truefalse') ? ['True', 'False'] : questionIndex.possible_answers;
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
      console.table(this.points);
    },
    uncheckAnswers() {
      this.message.isEnabled = !this.message.isEnabled;
      this.message.isAnswerCorrect = false;
      this.isAnswerActive = [];
      this.previousAnswerIndex = null;
      this.answer.classNames = [];
    },
    displayCorrectAnswers(isCorrect) {
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
            this.answer.classNames[index] = isCorrect ? 'correct' : 'wrong';
          }
        });
      });
    },
    async stopTime(isFinished) {
      await setTimeout((isFinished) => {
        if (!isFinished) {
          ++this.currentQuestion;
          this.uncheckAnswers();
          this.displayQuestion();
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

        // eg. if 0 convert to !0 = !false = true 
        if (this.question.type === 'truefalse') return !answerIndex == correctAnswer;
        return (this.question.answers[answerIndex].a_id === correctAnswer);
      }

      // case mutiplechoice-multiple below
      const correctAnswers = this.questionData.questions[this.currentQuestion].correct_answer;
      let sameAnswers = 0;
      
      correctAnswers.forEach(ans => {
        this.isAnswerActive.map((el, index) => {
          if (el === true) {
            if (this.question.answers[index].a_id === ans) sameAnswers++;
          }

          return el;
        });
      });

      return (sameAnswers === correctAnswers.length);
    },
    displayResults(results) {
      this.isQuizFinished = true;
      
      const currentResult = this.questionData.results.find(el => 
        (results >= (el.minpoints - 1)) && (results <= el.maxpoints)
      );

      this.question.title = currentResult.title;
      this.message.text = currentResult.message;
      this.totalScore = results;
    }
  },
}
</script>

<style lang="scss">
  $fontColor: rgb(171, 163, 152);
  $bodyColor: rgb(28, 31, 32);
  $answerColor: rgb(250 128 98 / 1);
  $answerHoverColor: rgb(50 47 47 / 90%);
  $answerActive: rgb(50 47 47 / 90%);
  $containerColor: rgb(24, 26, 27);
  $salmon: salmon;
  $nextBtn: rgb(0 0 0 / 90%);
  $nextBtnHover: rgb(110 109 109);
  $pageFontSize: 14px;

  $correctAnswer: rgb(120 141 120 / 95%);
  $wrongAnswer: rgb(230 10 10 / 0.90);

  *, *::before, *::after, body {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
  body {
    font-family: Sans-serif;
    font-size: $pageFontSize;
    background-color: $bodyColor;
    width: 100vw;
    height: 100vh;
    justify-content: center;
    align-items: center;
    display: flex;
    color: $fontColor;
  }
  .container {
    max-width: 40rem; //600px
    background-color: $containerColor;
    border-radius: 16px;
    border-color: rgba(140, 130, 115, 0.12);
    box-shadow: rgb(48 52 54 / 0.3) 0px 0px 20px 8px;
    padding: 1rem;
    margin: 0 1rem;
    display: flex;
    flex-direction: column;
  }
  .question-number {
    font-size: $pageFontSize + 2px;
    font-weight: 800;
    margin: 1rem 0;
    text-align: center;
    background: $fontColor;
    color: $containerColor;
  }
  .result-title {
    text-align: center;
    font-family: fantasy;
    font-size: medium;
  }
  img {
    width: 100%;
    margin: 4px 0;
  }
  .message {
    font-size: 0.8em;
    text-align: center;
    font-weight: bold;
  }
  .container-answers {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 10px;
    margin: 20px 2px;
  }
  .score-message {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1rem 0;
    color: rgb(143 220 66 / 92%);
  }
  .answer-btn {
    background-color: $answerColor;
    border: 2px solid $answerColor;

    &:hover {
      border-color: $answerHoverColor;
      background: $answerHoverColor;
      color: $salmon;
    }

    &.active {
      background-color: $answerActive;
      border-color: $answerActive;
      color: $salmon;
    }
  }
  .btn {
    border-radius: 3px;
    font-weight: bold;
    color: $containerColor;
    font-size: 1em;
    outline: none;

    &:enabled {
      cursor: pointer;
    }
    &.correct {
      background-color: $correctAnswer;
      border-color: $correctAnswer;
    }
    &.wrong {
      background-color: $wrongAnswer;
      border-color: $wrongAnswer;
    }
  }
  .next-btn {
    border: 2px solid $nextBtn;
    background-color: $nextBtn;
    color: $salmon;
    float: right;
    padding: 6px 20px;

    &:hover:enabled {
      background-color: $nextBtnHover;
      border-color: $nextBtnHover;
    }
  }
</style>
