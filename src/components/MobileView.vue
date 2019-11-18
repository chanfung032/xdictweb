<template>
  <div class="app" style="position:absolute">
    <div class="navbar navbar-app navbar-absolute-bottom">
      <div class="btn-group justified">
        <a href="#" class="btn btn-navbar" v-on:click="forget()">
          <i class="fa fa-navbar"></i> 覚えてない
        </a>
        <a href="#" class="btn btn-navbar" v-on:click="next(1)">
          <i class="fa fa-navbar"></i> 覚えた
        </a>
      </div>
    </div>
    <div class="app-body">
      <div class="app-content" v-if="words.length">
        <div class="scrollable">
          <div
            class="scrollable-content section"
            v-bind:style="{'background-color': words[current].hits < 0 ? '#e6e6fa' : 'white'}"
            v-on:dblclick="forget()"
            v-touch:swipe.left="swipeHandler"
          >
            <br />
            <div class="text-center">
              <h1 v-html="words[current].word"></h1>
            </div>
            <br />
            <div v-if="showMeaning" class="text-center">
              <p v-show="words[current].phonetic">
                [
                <span v-html="em(words[current].phonetic)"></span>]
              </p>
              <p class="meaning" v-html="render(words[current].meaning, words[current].word)"></p>
              <img v-bind:src="'/img/' + words[current].id" v-if="words[current].img" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import Vue2TouchEvents from "vue2-touch-events";
Vue.use(Vue2TouchEvents);
import helper from "../helpers.js";

export default {
  data: function() {
    return {
      words: [],
      current: 0,
      showMeaning: 0,
      limit: 50 //document.location.pathname.replace('/','') || 50,
    };
  },

  created: function() {
    this.next();
  },

  methods: {
    em: function(input) {
      return (input || "").replace(/[っょゅゃ]/g, "<sub>$&</sub>");
    },

    render: function(input, keyword) {
      input = input || "";
      var out = input
        .replace(/[:：\n]/g, "<br>")
        .replace(new RegExp(keyword, "gi"), "<em>$&</em>")
        .split(/\d+\. /g);
      return out.length < 2
        ? out[0]
        : out[0] + "<ol><li>" + out.slice(1).join("</li><li>") + "</li></ol>";
    },

    forget: function() {
      if (this.showMeaning) {
        var w = this.words.length ? this.words[this.current] : null;
        if (w != null) {
          this.$http.get("/api/forget?id=" + w.id);
        }
        this.next();
      } else {
        this.showMeaning = 1;
      }
    },

    swipeHandler() {
      return this.next();
    },

    next: function(markAsRememberd) {
      var w = this.words.length ? this.words[this.current] : null;
      if (w != null && markAsRememberd) {
        this.$http.get("/api/ok?id=" + w.id);
      }
      this._next();
    },

    _next: function() {
      if (this.current >= this.words.length - 1) {
        this.$http
          .get("/api/list?limit=" + this.limit + "&start=&fill=1")
          .then(function(res) {
            var words = helper.shuffle(res.data);
            if (
              this.words.length &&
              words[0].id == this.words[this.words.length - 1].id
            ) {
              words = words.reverse();
            }
            this.words = words;
            this.showMeaning = 0;
            this.current = 0;
          }, function(res) {
            if (res.status == 403) window.location.href = '/login';
          });
      } else {
        this.showMeaning = 0;
        this.current += 1;
      }
    }
  }
};
</script>

<style>
/*
@import url("/static/bower_components/mobile-angular-ui/dist/css/mobile-angular-ui-base.min.css") (max-width: 600px);
*/
@media (max-width: 600px) {
  .meaning ol,
  ul {
    text-align: left;
  }
  .meaning table,
  th,
  td {
    border: 1px solid black;
  }
  .meaning em {
    font-style: normal;
    font-weight: bold;
    color: #638c0b;
  }
  .app-content {
    font-size: 110%;
  }
}
</style>