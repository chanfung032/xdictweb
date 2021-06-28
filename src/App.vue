<template>
  <div id="app">
    <MobileView v-if="isMobile"></MobileView>
    <DesktopView v-else></DesktopView>
  </div>
</template>

<script>
import Vue from 'vue';
import VueResource from "vue-resource";
Vue.use(VueResource);
import DesktopView from "./components/DesktopView.vue";
import MobileView from "./components/MobileView.vue";

export default {
  name: "app",
  components: {
    DesktopView,
    MobileView,
  },
  computed: {
    isMobile: function() {
      return /iphone|android/i.test(navigator.userAgent)
    }
  }
};
</script>

<style>
body {
    font-family: "-apple-system", BlinkMacSystemFont, "游ゴシック", "Noto Sans Japanese", "ヒラギノ角ゴ Pro W3", "メイリオ", "Hiragino Kaku Gothic ProN", "MS PGothic", Osaka, "sans-serif";
}
</style>
