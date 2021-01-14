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

  <div class="container-answers" ref="buttons">
    <button 
      v-for="(ans, index) in question.possibleAnswers"
      :key="question.type === 'truefalse' ? index : ans.a_id"
      :value="index"
      :data-id="question.type === 'truefalse' ? !index : ans.a_id"
      :data-selected="answer.isCorrect"
      @click="(e) => toggleAnswers(e)"
      :class="[
        {correct: answer.isCorrect && answer.classNames[index]}, 
        {wrong: !answer.isCorrect && answer.classNames[index]}, 
        {active: isAnswerActive[index]}
      ]"
      class="answer-btn"
    >{{ question.type !== 'truefalse' ? ans.caption : ans }}</button>
  </div>

  <control-button>
    <button
      @click="setNextQuestion" 
      :disabled="isBtnDisabled"
      class="tool-btn"
    >{{ (question.currentIndex !== (totalQuestions - 1)) ? 'Next' : 'Finish' }}</button>
  </control-button>
</template>

<script>
import { ref, reactive, computed, onBeforeMount } from 'vue';

export default {
  name: 'Question',
  props: ['quizData'],
  emits: ['print-results'],
  setup (props, context) {
    const buttons = ref(null);
    const totalQuestions = ref(0);
    const previousAnswerIndex = ref('');
    const isBtnDisabled = ref(true);
    const isAnswerActive = ref([]); //all answers indexing by loop 1-4

    const points = reactive({
      player: 0,
      totalGame: 0
    });
    const question = reactive({
      currentIndex: 0,
      type: '',
      title: '',
      imageSrc: '',
      points: '',
      possibleAnswers: []
    });
    const answer = reactive({
      classNames: [],
      isCorrect: false,
    });
    const message = reactive({
      isEnabled: false,
      isAnswerCorrect: false,
      text: ''
    });

    onBeforeMount(() => {
      totalQuestions.value = props.quizData.length;
      displayQuestion();
    });

    const displayQuestion = () => {console.log(buttons.value);
      const questionIndex = props.quizData[question.currentIndex];
      question.type = questionIndex.question_type;
      question.title = questionIndex.title;
      question.imageSrc = require('@/assets/' + questionIndex.img);
      question.possibleAnswers = (question.type === 'truefalse') 
        ? ['True', 'False'] 
        : questionIndex.possible_answers;
      question.points = questionIndex.points;
    };
    
    const setNextQuestion = async () => {
      isBtnDisabled.value = true;
      const isCorrect = compareAnswers();
      addPoints(isCorrect);
      printMessage(isCorrect);
      displayCorrectAnswers(isCorrect);
      
      const isFinished = question.currentIndex >= (totalQuestions.value - 1);
      await stopTime(isFinished);
    };

    const addPoints = isCorrect => {
      if (isCorrect)
        points.player += question.points;
      points.totalGame += question.points;
      console.clear();
      console.table(points);
    };

    const printMessage = isCorrect => {
      message.isEnabled = true;
      message.isAnswerCorrect = isCorrect;
    };

    const uncheckAnswers = () => {
      message.isEnabled = !message.isEnabled;
      message.isAnswerCorrect = false;
      previousAnswerIndex.value = '';
      isAnswerActive.value = [];
      answer.classNames = [];
      answer.isCorrect = false;
    };

    const stopTime = async (isFinished) => {
      await setTimeout(() => {
        uncheckAnswers();
        
        if (!isFinished) {
          ++question.currentIndex;
          displayQuestion();
        } else {
          prepareResults();
        }
      }, 3000);
    };

    const toggleAnswers = e => {
      const isSelected = (e.target.getAttribute('data-selected') !== 'true');

      // toggle answers on one choice answer
      if (question.type !== 'mutiplechoice-multiple') {
        if (isSelected === false) return;
        
        if (previousAnswerIndex.value) {
          buttons.value.children[previousAnswerIndex.value].setAttribute('data-selected', !isSelected);
          isAnswerActive.value[previousAnswerIndex.value] = !isSelected;
        }

        previousAnswerIndex.value = e.target.value;
      }

      e.target.setAttribute('data-selected', isSelected);
      isAnswerActive.value[e.target.value] = isSelected;
      isBtnDisabled.value = !isAnswerActive.value.includes(true);
      console.log(isAnswerActive.value);
    };

    const compareAnswers = () => {
      if (question.type !== 'mutiplechoice-multiple') {
        const correctAnswer = props.quizData[question.currentIndex].correct_answer;
        const answerIndex = isAnswerActive.value.findIndex(el => el === true);

        if (question.type === 'truefalse') 
          return !answerIndex == correctAnswer;
        
        return (question.possibleAnswers[answerIndex].a_id === correctAnswer);
      }

      // case mutiplechoice-multiple below
      const correctAnswers = props.quizData[question.currentIndex].correct_answer;
      let sameAnswers = 0;
      const numberOfAnswered = isAnswerActive.value.filter(el => el === true).length;
      
      correctAnswers.forEach(ans => {
        isAnswerActive.value.map((el, index) => {
          if (el === true) {
            if (question.possibleAnswers[index].a_id === ans) sameAnswers++;
          }

          return el;
        });
      });

      return (sameAnswers === correctAnswers.length) 
        && (numberOfAnswered === correctAnswers.length);
    };

    const displayCorrectAnswers = isCorrect => {
      answer.isCorrect = isCorrect;
      let correctAnswers = [];

      if (question.type === 'mutiplechoice-multiple') {
        correctAnswers = props.quizData[question.currentIndex].correct_answer;
      } else {
        correctAnswers[0] = props.quizData[question.currentIndex].correct_answer;
      }

      buttons.value.children.forEach((button, index) => {
        correctAnswers.forEach(ans => {
          if (button.getAttribute('data-id') === String(ans)) {
            answer.classNames[index] = true;
          }
        });
      });
    };

    const prepareResults = () => {
      let results = null;
      let errorMsg = null;
      
      try {
        results = Math.floor(points.player * 100 / points.totalGame);
      } catch (e) {
        console.log(e.message);
        errorMsg = 'Something went wrong with game points';
      }

      context.emit('print-results', {results, errorMsg});
    };

    return {
      buttons,
      totalQuestions,
      previousAnswerIndex,
      isBtnDisabled,
      isAnswerActive,
      points,
      question,
      answer,
      message,
      setNextQuestion,
      toggleAnswers
    };
  },
}
</script>