<template>
  <header class="header">
    <div class="header-content">
      <span class="header-text">Sonificación Estudio</span>
      
    </div>
  </header>
</template>

<script>
export default {
  name: 'PageHeaderComponent'
};
</script>

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
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .header-text {
    font-size: 18px;
    font-weight: bold;
    color: white;
  }
</style>