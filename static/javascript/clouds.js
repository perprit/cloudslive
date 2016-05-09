// Generated by CoffeeScript 1.9.3
(function() {
  var Main;

  Main = (function() {
    function Main() {
      console.log(this);
      this.reftime = 0;
      this.speed = 1;
      this.timeBin = 20000;
      this.freqMax = 80;
      $("#upload-file > input:file").change((function(_this) {
        return function() {
          var form_data, overlay, spinner;
          overlay = $("<div class='overlay'> </div>");
          spinner = $("<div class='spinner'> </div>");
          overlay.appendTo($("body"));
          spinner.appendTo($("body"));
          form_data = new FormData($("#upload-file")[0]);
          return $.ajax({
            type: 'POST',
            url: '/upload',
            data: form_data,
            contentType: false,
            cache: false,
            processData: false,
            async: true,
            success: function(response) {
              var d, i, j, len, parsed;
              parsed = JSON.parse(response);
              _this.reftime = +parsed[0].ts;
              for (i = j = 0, len = parsed.length; j < len; i = ++j) {
                d = parsed[i];
                parsed[i].ts -= _this.reftime;
              }
              return _this.initialize(parsed);
            },
            error: function(jqXHR, textStatus, errorThrown) {
              return alert(textStatus + " ,  " + errorThrown);
            },
            complete: function() {
              overlay.remove();
              return spinner.remove();
            }
          });
        };
      })(this));
    }

    Main.prototype.initialize = function(chats) {
      this.initializeChats(chats);
      this.initializeClouds(chats);
      $("#chats-container").perfectScrollbar();
      return $("#clouds-container").perfectScrollbar();
    };

    Main.prototype.initializeChats = function(chats) {
      var addChat, chat, currChats, j, len, results, setTimeoutToChat;
      currChats = [];
      addChat = (function(_this) {
        return function(chat) {
          var msg, newChat;
          currChats.push(chat);
          newChat = d3.select("#chats").selectAll(".chat").data(currChats).enter().append("div").attr("class", "chat");
          newChat.append("span").attr("class", "time").text(function(d) {
            return new Date(_this.reftime + d.ts).hhmmss();
          });
          newChat.append("span").attr("class", "id").style("color", function(d) {
            var hash;
            hash = d.id.hashCode();
            return "#" + ((hash & 0xFF0000) >> 16).toString(16) + ((hash & 0x00FF00) >> 8).toString(16) + (hash & 0x0000FF).toString(16);
          }).text(function(d) {
            return d.id;
          });
          newChat.append("span").attr("class", "colon").text(function(_) {
            return ":";
          });
          msg = newChat.append("span").attr("class", "msg");
          msg.node().innerHTML = chat.msg;
          return $("#chats-container").stop().animate({
            scrollTop: $("#chats").height()
          }, 100);
        };
      })(this);
      setTimeoutToChat = (function(_this) {
        return function(chat) {
          return setTimeout(function() {
            return addChat(chat);
          }, +chat.ts / _this.speed);
        };
      })(this);
      results = [];
      for (j = 0, len = chats.length; j < len; j++) {
        chat = chats[j];
        results.push(setTimeoutToChat(chat));
      }
      return results;
    };

    Main.prototype.initializeClouds = function(chats) {
      var addChat, addWord, chat, cloud, g, height, j, len, margin, parser, refreshClouds, results, setTimeoutToChat, svg, width, words;
      margin = {
        top: 30,
        right: 30,
        bottom: 30,
        left: 30
      };
      width = parseInt(d3.select("#clouds-container").style("width"), 10) - margin.left - margin.right;
      height = parseInt(d3.select("#clouds-container").style("height"), 10) - margin.top - margin.bottom;
      svg = d3.select("#clouds-container").append("svg").attr("id", "clouds").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
      g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      words = [];
      cloud = g.selectAll(".cloud").data(words, function(d) {
        return d["word"];
      });
      parser = new DOMParser();
      addWord = (function(_this) {
        return function(word, ts) {
          var found;
          found = words.find(function(e, i, a) {
            return e["word"] === word;
          });
          if (typeof found === "undefined") {
            return words.push({
              "word": word,
              "ts": [ts]
            });
          } else {
            return words[words.map(function(d) {
              return d["word"];
            }).indexOf(word)]["ts"].push(ts);
          }
        };
      })(this);
      refreshClouds = (function(_this) {
        return function() {
          var bbox;
          cloud = g.selectAll(".cloud").data(words, function(d) {
            return d["word"];
          });
          cloud.enter().append("text").attr("class", "cloud").attr("y", function(d) {
            return d["ts"][0] / 10;
          }).text(function(d) {
            return d["word"];
          });
          cloud.style("font-size", function(d) {
            return 10 + d["ts"].length * 3;
          });
          cloud.data(words, function(d) {
            return d["word"];
          }).exit().remove();
          bbox = d3.select("#clouds")[0][0].getBBox();
          return svg.attr("height", bbox.y + bbox.height);
        };
      })(this);
      addChat = (function(_this) {
        return function(chat) {
          var e, j, k, len, len1, parsed, ref, ref1, w;
          parsed = parser.parseFromString(chat.msg, "text/html");
          ref = parsed.body.childNodes;
          for (j = 0, len = ref.length; j < len; j++) {
            e = ref[j];
            if (e.nodeName === "IMG") {
              addWord("(" + e.title + ")", chat.ts);
            } else if (e.nodeName === "#text") {
              ref1 = e.nodeValue.split(" ");
              for (k = 0, len1 = ref1.length; k < len1; k++) {
                w = ref1[k];
                addWord(w, chat.ts);
              }
            }
          }
          return $("#clouds-container").stop().animate({
            scrollTop: $("#clouds").height()
          }, 100);
        };
      })(this);
      setTimeoutToChat = (function(_this) {
        return function(chat) {
          return setTimeout(function() {
            addChat(chat);
            return refreshClouds();
          }, +chat.ts / _this.speed);
        };
      })(this);
      results = [];
      for (j = 0, len = chats.length; j < len; j++) {
        chat = chats[j];
        results.push(setTimeoutToChat(chat));
      }
      return results;
    };

    return Main;

  })();

  $(function() {
    return window.main = new Main;
  });

}).call(this);
