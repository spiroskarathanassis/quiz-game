<template>
  <div class="result-title">{{ result.title }}</div>
  <img :src="result.imageSrc" alt="" />
  <p class="message">{{ result.message }}</p>
  <div class="score-message">Your score is {{ score }} %</div>
  <control-button>
    <button
      @click="resetQuiz"
      class="tool-btn start">Play Again</button>
  </control-button>
</template>

<script>
export default {
  name: 'Result',
  props: ['quizData', 'totalScore'],
  emits: ['reset-quiz'],
  mounted () {
    this.displayResults();
  },
  data () {
    return {
      result: {
        title: '',
        imageSrc: '',
        message: ''
      },
      score: this.totalScore ?? 0
    }
  },
  methods: {
    displayResults() {
      const currentResult = this.quizData.find(el => 
        (this.score >= (el.minpoints)) && (this.score <= el.maxpoints)
      );

      this.result.title = currentResult.title;
      this.result.imageSrc = require('../assets/' + currentResult.img);
      this.result.message = currentResult.message;
    },
    resetQuiz() {
      this.$emit('reset-quiz');
    }
  }
}
</script>