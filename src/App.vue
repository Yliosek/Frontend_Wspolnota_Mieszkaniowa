<template>
  <router-view />
</template>

<style>
/* Globalny reset stylów dla całej aplikacji */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f4f7f6; /* Jasne, szare tło domyślne dla całej aplikacji */
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Ułatwia zarządzanie wielkością elementów */
* {
  box-sizing: border-box;
}

/* Reset marginesów dla głównych nagłówków */
h1, h2, h3, p {
  margin-top: 0;
}
</style>