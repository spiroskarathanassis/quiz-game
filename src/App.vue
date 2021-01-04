<template>
  <div v-if="errorMessage.length > 0" style="color: red">{{ errorMessage }} <b>!</b></div>
  <div v-else class="container">
    <template v-if="!isQuizActive">
      <div>{{ quiz.title }}</div>
      <control-button extraClass="start-ctl">
        <button
          @click="setComponent('question')" 
          class="tool-btn start"
        >Start</button>
      </control-button>
    </template>
    <question 
      v-else-if="displayedComponent == 'question'"
      :quiz-data="quiz.data.questions"
      @print-results="prepareResults" />
    <result v-else
      :quiz-data="quiz.data.results"
      :total-score="totalScore"
      @reset-quiz="resetQuiz" />
  </div>
</template>

<script>
import Question from './components/Question.vue';
import Result from './components/Result.vue';

export default {
  name: 'App',
  components: {
    Question,
    Result,
  },
  data () {
    return {
      isQuizActive: false,
      displayedComponent: 'question',
      errorMessage: '',
      quiz: {
        title: '',
        data: '',
      },
      totalScore: 0
    }
  },
  async created () {
    this.quiz.data = await this.fetchQuizData(false); //questionsc
    this.quiz.title = this.quiz.data.title;
  },
  methods: {
    fetchQuizData(isGameFinished) {
      const statement = isGameFinished ? 'results' : 'questions';
      const baseUrl = 'https://apis-game-default-rtdb.europe-west1.firebasedatabase.app/apis-game-default-rtdb/';

      return fetch(baseUrl + statement + '.json')
        .then(res => res.json())
        .then(res => res)
        .catch(e => {
          // console.error(e.message);
          this.errorMessage = 'Cannot fetch quiz data from api';
        });
    },
    setComponent(cmp) {
      this.isQuizActive = true;
      this.displayedComponent = cmp;
    },
    async prepareResults({results, errorMsg}) {
      if (errorMsg != null) {
        this.errorMessage = errorMsg;
        return;
      }
      
      this.quiz.data = await this.fetchQuizData(true); //results
      this.setComponent('result');
      this.totalScore = results;
    },
    async resetQuiz() {
      this.quiz.data = await this.fetchQuizData(false); //questions
      this.setComponent('question');
    }
  }
}
</script>

<style lang="scss">
  @import "./app.scss";
</style>