<template>
  <div class="question-number">Question {{question.currentIndex + 1}} / {{ totalQuestions }}</div>
  <div>{{ question.title }}
    <strong 
      v-show="question.type === 'mutiplechoice-multiple'" 
      title="mutiplechoice question">*</strong>
  </div>
  <img :src="question.imageSrc" alt="" />
  <p 
    v-show="message.isEnabled"
    class="message"
  >{{ message.isAnswerCorrect ? 'Correct Answer' : 'Wrong Answer' }}</p>

  <div id="answers" class="container-answers">
    <button 
      v-for="(ans, index) in question.possibleAnswers"
      :key="question.type === 'truefalse' ? index : ans.a_id"
      :value="index"
      :data-id="question.type === 'truefalse' ? !index : ans.a_id"
      data-selected="false"
      @click="this.toggleAnswers"
      :class="[
        {correct: answer.isCorrect && answer.classNames[index]}, 
        {wrong: !answer.isCorrect && answer.classNames[index]}, 
        {active: isAnswerActive[index]}
      ]"
      class="answer-btn"
    >{{ question.type !== 'truefalse' ? ans.caption : ans }}</button>
  </div>

  <div class="conrtols">
    <button
      @click="setNextQuestion" 
      :disabled="isBtnDisabled"
      class="tool-btn"
    >{{ (question.currentIndex !== (totalQuestions - 1)) ? 'Next' : 'Finish' }}</button>
  </div>
</template>

<script>
export default {
  name: 'Question',
  props: ['quizData'],
  emits: ['print-results'],
  data () {
    return {
      totalQuestions: null,
      previousAnswerIndex: null,
      isAnswerActive: [], //all answers indexing by loop 1-4
      isBtnDisabled: true,
      points: {
        player: 0,
        totalGame: 0
      },
      question: {
        currentIndex: 0,
        type: '',
        title: '',
        imageSrc: '',
        points: '',
        possibleAnswers: []
      },
      message: {
        isEnabled: false,
        isAnswerCorrect: false,
        text: ''
      },
      answer: {
        classNames: [],
        isCorrect: false,
      },
    }
  },
  created () {
    this.totalQuestions = this.quizData.length;
    this.displayQuestion();
  },
  methods: {
    displayQuestion() {
      const questionIndex = this.quizData[this.question.currentIndex];
      this.question.type = questionIndex.question_type;
      this.question.title = questionIndex.title;
      this.question.imageSrc = require('@/assets/' + questionIndex.img);
      this.question.possibleAnswers = (this.question.type === 'truefalse') 
        ? ['True', 'False'] 
        : questionIndex.possible_answers;
      this.question.points = questionIndex.points;
    },
    async setNextQuestion() {
      this.isBtnDisabled = true;
      const isCorrect = this.compareAnswers();
      this.addPoints(isCorrect);
      this.postMessage(isCorrect);
      this.displayCorrectAnswers(isCorrect);
      
      const isFinished = this.question.currentIndex >= (this.totalQuestions - 1);
      await this.stopTime(isFinished);
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
          ++this.question.currentIndex;
          this.displayQuestion();
        } else {
          this.prepareResults();
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
        const correctAnswer = this.quizData[this.question.currentIndex].correct_answer;
        const answerIndex = this.isAnswerActive.findIndex(el => el === true);

        if (this.question.type === 'truefalse') return !answerIndex == correctAnswer;
        return (this.question.possibleAnswers[answerIndex].a_id === correctAnswer);
      }

      // case mutiplechoice-multiple below
      const correctAnswers = this.quizData[this.question.currentIndex].correct_answer;
      let sameAnswers = 0;
      const numberOfAnswered = this.isAnswerActive.filter(el => el === true).length;
      
      correctAnswers.forEach(ans => {
        this.isAnswerActive.map((el, index) => {
          if (el === true) {
            if (this.question.possibleAnswers[index].a_id === ans) sameAnswers++;
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
        correctAnswers = this.quizData[this.question.currentIndex].correct_answer;
      } else {
        correctAnswers[0] = this.quizData[this.question.currentIndex].correct_answer;
      }

      buttons.forEach((button, index) => {
        correctAnswers.forEach(ans => {
          if (button.getAttribute('data-id') === String(ans)) {
            this.answer.classNames[index] = true;
          }
        });
      });
    },
    prepareResults() {
      let results = null;
      let errorMsg = null;
      
      try {
        results = Math.floor(this.points.player * 100 / this.points.totalGame);
      } catch (e) {
        console.log(e.message);
        errorMsg = 'Something went wrong with game points';
      }

      this.$emit('print-results', {results, errorMsg});
    },
  },
}
</script>