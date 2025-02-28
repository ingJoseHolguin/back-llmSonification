export default store => {
  store.subscribe((mutation, state) => {
    localStorage.setItem('vuex', JSON.stringify(state));
  });
};