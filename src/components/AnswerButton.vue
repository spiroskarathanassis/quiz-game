<template>
  {{ listButtons }}
</template>

<script>
export default {
  name: 'AnswerButton',
  data() { 
    return {
      listButtons: `
        <button 
          v-for="(ans, index) in question.possibleAnswers"
          :key="question.type === 'truefalse' ? index : ans.a_id"
          :value="index"
          :data-id="question.type === 'truefalse' ? !index : ans.a_id"
          data-selected="false"
          @click="(e) => toggleAnswers(e)"
          :class="[
            {correct: answer.isCorrect && answer.classNames[index]}, 
            {wrong: !answer.isCorrect && answer.classNames[index]}, 
            {active: isAnswerActive[index]}
          ]"
          class="answer-btn"
        >{{ question.type !== 'truefalse' ? ans.caption : ans }}</button>`
    }
  }
}
</script>