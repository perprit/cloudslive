"use strict";
(function() {
  var Main;

  Main = (function() {
    // constructor
    function Main() {
      // member variables
      this.reftime = 0;
      this.speed = 1;
      this.timeBin = 20000;
      this.freqMax = 80;

      // file uploader
      $("#upload-file > input:file").change((function(_this) {
        return function() {
          var form_data, overlay, spinner;
          overlay = $("<div class='overlay'> </div>");
          spinner = $("<div class'spinner'> </div>");
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
              var parsed, i;
              parsed = JSON.parse(response);
              _this.reftime = +parsed[0].ts;
              parsed.forEach(function(d) {
                d.ts -= _this.reftime;
              });
              _this.initialize(parsed);

            },
            error: function(jqXHR, textStatus, errorThrown) {
              alert(textStatus + " , " + errorThrown);
            },
            complete: function() {
              overlay.remove();
              spinner.remove();
            }
          });
        };
      })(this));

      // perfect scrollbars
      $("#chats-container").perfectScrollbar();
      $("#clouds-container").perfectScrollbar();
    };

    // constant
    
    Main.MAX_CHAT = 5000;

    // member functions
    
    Main.prototype.initialize = function (chats) {
      this.initializeChats(chats);
      this.initializeClouds(chats);
    };

    Main.prototype.initializeChats = function (chats) {
      // declarations
      var currChats, addChat, setTimeoutToChat;
      currChats = [];

      // functions
      addChat = (function(_this) {
        return function(chat) {
          var msg, newChat;

          currChats.push(chat);
          newChat = d3.select("#chats").selectAll(".chat")
            .data(currChats)
            .enter()
            .append("div")
            .attr("class", "chat");

          //newChat.append("span")
            //.attr("class", "time")
            //.text(function(d) {
              //var date = new Date(_this.reftime + d.ts);
              //var hh = date.getHours().toString();
              //var mm = date.getMinutes().toString();
              //var ss = date.getSeconds().toString();
              //return (hh[1]?hh:"0"+hh[0]) + ":" + (mm[1]?mm:"0"+mm[0]) + ":" + (ss[1]?ss:"0"+ss[0]);
            //});

          newChat.append("span")
            .attr("class", "id")
            .style("color", function(d) {
              var hash;
              hash = d.id.hashCode();
              return "#"+((hash & 0xFF0000)>>16).toString(16)+((hash & 0x00FF00)>>8).toString(16)+(hash & 0x0000FF).toString(16);
            })
            .text(function(d) { return d.id; });

          newChat.append("span")
            .attr("class", "colon")
            .text(function(_) { return ":"; });

          msg = newChat.append("span")
            .attr("class", "msg");

          msg.node().innerHTML = chat.msg;

          $("#chats-container").stop().animate({scrollTop: $("#chats").height()}, 100);

        };
      })(this);

      setTimeoutToChat = (function(_this) {
        return function(chat) {
          setTimeout(function() { addChat(chat); }, +chat.ts/_this.speed);
        };
      })(this);

      // operations
      chats.forEach(function(d, i) {
//        if(i<Main.MAX_CHAT)
//          setTimeoutToChat(d);
      });
    };

    Main.prototype.initializeClouds = function(chats) {
      // declarations
      var margin, width, height, svg, g;
      var words, cloud, parser;
      var addWord, refreshClouds, addChat, setTimeoutToChat;
      
      // functions
      addWord = (function(_this) {
        return function(word, html, ts) {
          var found;
          found = words.find(function(d) {
            return d.word === word;
          });
          if (typeof found === "undefined") {
            words.push({"word": word, "html": html, "ts": [ts]});
          } else {
            words[words.map(function(d) { return d.word; }).indexOf(word)]["ts"].push(ts);
          }
        };
      })(this);

      var count = 0;

      refreshClouds = (function(_this) {
        return function(currentTime) {
          var cloud, bbox;
          var wordle = g.append('div').style('word-wrap', 'break-word').style('margin-top', '20px');
        
          words.forEach(function(word){
            word.ts = word.ts.filter(function(ts) {
              return ts - chats[0].ts > currentTime - 5000;
            })
          });
          
          cloud = wordle.selectAll("div")
            .data(
              words
                .filter(function(word){
                  return word.ts.length > 0;
                })
                .sort(function(a, b){
                  return b.ts.length - a.ts.length;
                })
            , function(d) { return d.word; });

          cloud.enter()
            .append("span")
            .attr('class', 'cloud')
            .text(function(d) { return d.word; });

          cloud
            .style("font-size", function(d) { return 5 + d.ts.length * Math.sqrt(d.ts.length) + 'px'; });

          cloud.data(words, function(d) { return d.word; })
            .exit()
            .remove(); 

          count++;

          var divs = g.selectAll('div');
          var s = divs.size();
          divs.filter(function(d, i){
            return i < s - 10;
          })
          .remove();

          $("#clouds-container")[0].scrollTop = $('#clouds').height();
        };
      })(this);

      addChat = (function(_this) {
        return function(chat) {
          var parsed, nodearr;
          parsed = parser.parseFromString(chat.msg, "text/html"); 
          nodearr = Array.prototype.slice.call(parsed.body.childNodes);
          nodearr.forEach(function(d) {
            if(d.nodeName === "IMG") {
              addWord("("+d.alt+")", d, chat.ts);
            } else if (d.nodeName === "#text") {
              (d.data.trim().split(/[ ]+/)).forEach(function(w) {
                addWord(w, d, chat.ts);
              });
            } else {
              console.error("unexpected nodeName", d.nodeName);
            }
          });
        };
      })(this);

      setTimeoutToChat = (function (_this) {
        return function(chat) {
          setTimeout(function() {
            addChat(chat);
            refreshClouds();
          }, +chat.ts/_this.speed);
        };
      })(this);

      // operations
      margin = {top: 30, right: 30, bottom: 30, left: 30};
      width = parseInt(d3.select("#clouds-container").style("width"), 10) - margin.left - margin.right;
      height = parseInt(d3.select("#clouds-container").style("height"), 10) - margin.top - margin.bottom;

      svg = d3.select("#clouds-container").append("div")
        .attr("id", "clouds")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      g = svg.append("div")
        .attr("transform", "translate(" + margin.left + "," + margin.top+")");

      words = [];
      cloud = g.selectAll(".cloud")
        .data(words, function (d) { return d.word });
      parser = new DOMParser();

      var initialTime = chats[0].ts;
      var maxTime = chats[Math.min(Main.MAX_CHAT, chats.length - 1)].ts - initialTime;
      var acc = 0;

      var timer = setInterval(function(d){
        chats
          .filter(function(chat) {
            return acc <= chat.ts - initialTime && chat.ts - initialTime < acc + 1000;
          })
          .forEach(addChat);

        refreshClouds(acc);

        acc += 1000;
        if(acc > maxTime) {
          clearInterval(timer);
        }
      }, 1000);

      console.log(maxTime);
/*      chats.forEach(function(d, i) {
        if(i<Main.MAX_CHAT)
          setTimeoutToChat(d);
      });*/
    };

    return Main;
  })();

  // $(function() { ... });
  // equals to : $(document).ready(function() { ... });
  $(function() {
    window.main = new Main();
  }); 

}).call(this);
