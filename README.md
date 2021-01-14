# Project Quiz Game

<div style="display:flex;justify-content:center;align-items:center;flex-direction:column;">
  <h2 style="color:#e4c652">Preview</h2>
  <img src="./preview/demo.gif" width="400px"/>
</div>

### Tools
- Handle (questions & results) json data from firebase api
- Compress images to webp format from squoosh cli package
- Used SCSS style
 
### Description
- Request question's data
- splitted by 3 types of question: [true-false, mutiple-answer, single-answer]
- for each question post title, image, answers, next button
- coloring correct answers by the correction of answers
- display suitable message (true /false)
- wait 3 seconds until go to next question
- collect player points from every correct answer
- Finish with displaying percentage (%) of player's score
- Finally, if error occurs print it

### Technologies
- Vue 3 with vue CLI
- Firebase Real Time Database
