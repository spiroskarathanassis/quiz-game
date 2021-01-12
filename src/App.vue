<template>
  <div v-if="errorMessage.length > 0" style="color: red">{{ errorMessage }} <b>!</b></div>
  <div v-else class="container">
    <template v-if="!isQuizActive">
      <div>{{ quiz.data?.title ?? '' }}</div>
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
import { ref, reactive, onBeforeMount } from 'vue';

import Question from './components/Question.vue';
import Result from './components/Result.vue';

export default {
  name: 'App',
  components: {
    Question,
    Result,
  },
  setup () {
    const errorMessage = ref('');
    const isQuizActive = ref('');
    const displayedComponent = ref('question');
    const totalScore = ref(0);
    const quiz = reactive({
      data: null
    });

    const fetchQuizData = async (isGameFinished) => {
      const statement = isGameFinished ? 'results' : 'questions';
      const baseUrl = 'https://apis-game-default-rtdb.europe-west1.firebasedatabase.app/apis-game-default-rtdb/';

      return await fetch(baseUrl + statement + '.json')
        .then(res => res.json())
        .then(res => res)
        .catch(e => errorMessage.value = 'Cannot fetch quiz data from api');
    }
    
    onBeforeMount(async () => {
      quiz.data = await fetchQuizData(false); //questions
    })

    const setComponent = cmp => {
      isQuizActive.value = true;
      displayedComponent.value = cmp;
    };

    const prepareResults = async ({results, errorMsg}) => {
      if (errorMsg != null) {
        errorMessage.value = errorMsg;
        return;
      }
      
      quiz.data = await fetchQuizData(true); //results
      setComponent('result');
      totalScore.value = results;
    };

    const resetQuiz = async () => {
      quiz.data = await fetchQuizData(false); //questions
      setComponent('question');
    };

    return {
      isQuizActive,
      displayedComponent,
      errorMessage,
      quiz,
      totalScore,
      setComponent,
      prepareResults,
      resetQuiz
    };
  }
}
</script>

<style lang="scss">
  @import "./app.scss";
</style>