<template>
  <div style="width: 80%; margin: 0 auto">
    <nav class="navbar navbar-default">
      <div class="container-fluid">
        <div class="navbar-header">
          <a class="navbar-brand" href="#">単語帳</a>
        </div>
        <div id="navbar" class="navbar-collapse collapse">
          <ul class="nav navbar-nav">
            <li :class="{active: api == '/api/list'}">
              <a href="#" @click="go('/api/list')">学習中</a>
            </li>
            <li :class="{active: api == '/api/review'}">
              <a href="#" @click="go('/api/review')">復習</a>
            </li>
            <li>
              <a href="#" @click="info()">統計情報</a>
            </li>
          </ul>
          <div class="col-sm-3 col-md-3 navbar-right">
            <form class="navbar-form" role="search">
              <input type="text" class="form-control" placeholder="検索" v-model="search" />
            </form>
          </div>
        </div>
      </div>
    </nav>

    <div id="content">
      <div>
        <button class="btn btn-default" @click="add">
          <span class="glyphicon glyphicon-plus"></span> 追加
        </button>
        <span class="pull-right text-muted">{{words.length}} 個の単語</span>
      </div>
      <table class="table table-condensed">
        <thead>
          <tr>
            <th width="10%">単語</th>
            <th width="10%">読み方</th>
            <th width="80%">意味</th>
            <th>Hits</th>
            <th></th>
          </tr>
        </thead>
        <tbody v-infinite-scroll="loadMore" infinite-scroll-distance="10">
          <tr
            v-for="(w, $index) in words.slice(0, totalDisplayed)"
            :key="w.id"
            :style="{'background-color': w.recites == 0 ? 'white' : 'lavenderblush'}"
          >
            <template v-if="w.$e">
              <td>
                <input
                  class="form-control input-sm"
                  type="text"
                  v-model="w.word"
                  @keyup.enter="update($index, w)"
                />
              </td>
              <td>
                <input
                  class="form-control input-sm"
                  type="text"
                  v-model="w.phonetic"
                  @keyup.enter="update($index, w)"
                />
              </td>
              <td>
                <textarea-autosize
                  rows="1"
                  class="form-control input-sm"
                  v-model="w.meaning"
                  @keydown.enter.exact.prevent.native
                  @keyup.enter.exact.native="update($index, w)"
                />
              </td>
              <td class="hits">{{w.hits}}</td>
              <td class="sn">
                <button type="submit" :disabled="!w.word" @click="update($index, w)" class="btn btn-primary btn-sm">
                  <span class="glyphicon glyphicon-ok"></span>
                </button>
                <button type="button" @click="cancel($index, w)" class="btn btn-default btn-sm">
                  <span class="glyphicon glyphicon-remove"></span>
                </button>
                <button class="btn btn-default btn-sm" disabled>
                  <span class="glyphicon glyphicon-picture"></span>
                </button>
              </td>
            </template>
            <template v-else>
              <td>{{w.word}}</td>
              <td>{{w.phonetic ? '['+w.phonetic+ ']' : ''}}</td>
              <td>
                {{w.meaning}}
                <br />
                <img :src="'/img/' + w.id" v-if="w.img" />
              </td>
              <td class="hits">{{w.hits}}</td>
              <td class="sn">
                <button class="btn btn-default btn-sm" @click="w.$e = 1">
                  <span class="glyphicon glyphicon-pencil"></span>
                </button>
                <button class="btn btn-default btn-sm" @click="deleteRow(w.id)">
                  <span class="glyphicon glyphicon-trash"></span>
                </button>
                <button class="btn btn-default btn-sm" @click="upload(w.id)">
                  <span
                    :style="{'color': w.img ? 'tomato': 'black'}"
                    class="glyphicon glyphicon-picture"
                  ></span>
                </button>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import infiniteScroll from "vue-infinite-scroll";
import Vue from "vue";
import TextareaAutosize from "vue-textarea-autosize";
Vue.use(TextareaAutosize);

export default {
  name: "DesktopView",

  data() {
    return {
      api: "",
      words: [],
      search: "",
      totalDisplayed: 50
    };
  },

  directives: { infiniteScroll },

  created: function() {
    return this.go("/api/list");
  },

  watch: {
    search: function(val) {
      setTimeout(() => {
        if (this.search != val) return;
        if (val == "") {
          this.go(this.api);
        } else {
          this.go("/api/search?k=" + val, 1);
        }
      }, 300);
    }
  },

  methods: {
    go: function(api, n) {
      if (!n) {
        this.api = api;
      }
      this.$http.get(api).then(function(resp) {
        this.totalDisplayed = 50;
        resp.data.forEach(x => (x.$e = undefined));
        this.words = resp.data;
      });
    },

    f: function(i) {
      return this.words.findIndex(function(e) {
        return e.id == i;
      });
    },

    add: function() {
      this.words.unshift({
        id: -1,
        word: "",
        phonetic: "",
        meaning: "",
        hits: 1,
        $e: 1
      });
    },

    cancel: function(i, w) {
      w.$e = 0;
      if (this.words[i].id == -1) {
        this.words.splice(i, 1);
      }
    },

    keypress: function(e, form) {
      if (e.which == 13 && !e.shiftKey) {
        form.$submit();
      }
    },

    update: function($index, w) {
      return this.$http.post("/api/update", w).then(function(r) {
        w.$e = 0;
        if (w.id == -1) {
          var i = this.f(w.id);
          if (i != -1) this.words[i].id = r.data;
        }
      });
    },

    upload: function(id) {
      var url = prompt("画像のURLまたはコピーした画像を入力してください");
      if (url != null)
        this.$http.post("/api/upload", { id: id, url: url }).then(function() {
          var i = this.f(id);
          if (i != -1) this.words[i].img = url ? 1 : 0;
        });
    },

    deleteRow: function(id) {
      if (!confirm("削除することを確認しますか？")) return;

      this.$http.get("/api/delete?id=" + id).then(function() {
        var i = this.f(id);
        if (i != -1) this.words.splice(i, 1);
      });
    },

    loadMore: function() {
      this.totalDisplayed += 50;
    },

    info: function() {
      this.$http.get("/api/info").then(function(resp) {
        var d = resp.data;
        var detail = resp.data.r2c
          .map(function(e) {
            return e.recites + " |" + "|".repeat(e.count / 100) + " " + e.count;
          })
          .join("\n");
        alert(
          "合計: " +
            d.total +
            ", 覚えた: " +
            d.graduated +
            ", 学習中: " +
            (d.total - d.graduated) +
            ", 新規: " +
            d.new +
            ", 非英語:" +
            d.other +
            "\n==========\n" +
            detail
        );
      });
    }
  }
};
</script>

<style>
/*
@import url("/static/bower_components/bootstrap/dist/css/bootstrap.css") (min-width:600px);
*/
table input {
  width: 100%;
}
.sn {
  white-space: nowrap;
}
button:focus {
  outline:none;
}
</style>
