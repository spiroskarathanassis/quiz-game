<template>
  <div :class="extraClass ?? null">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'ControlButton',
  props: ['extraClass']
}
</script>

<style scoped>
  .start-ctl {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 4rem 0;
  }
</style>