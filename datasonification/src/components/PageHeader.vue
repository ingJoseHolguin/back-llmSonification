<template>
  <header class="header">
    <div class="header-content">
      <img src="@/assets/sonify-logo.svg" alt="Sonify Harmony Logo" class="header-logo">
      <span class="header-text">SonifyData</span>
    </div>
  </header>
</template>

<style scoped>
  @import '../styles/global.css';
  
  .header {
    background-color: #2c3e50;
    padding: 10px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .header-content {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
  }
  
  .header-logo {
    height: 55px;
    width: auto;
    margin-right: 22px;
    filter: brightness(0) invert(1) saturate(0) contrast(100);  
  }
  
  .header-text {
    font-size: 25px;
    font-weight: bold;
    color: white;
  }
</style>