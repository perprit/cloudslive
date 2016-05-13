"use strict";
(function() {
  var Main;

  Main = (function() {
    // constructor
    function Main() {
      // member variables
      this.reftime = 0;
      this.speed = 2;
      this.space = 6;
			this.MAX_CHAT = 10;

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
      //chats.forEach(function(d) {
			chats.slice(0, this.MAX_CHAT).forEach(function(d) {
        setTimeoutToChat(d);
      });
    };

    Main.prototype.initializeClouds = function(chats) {
      // declarations
      var margin, width, height, svg, g;
      var words, parser;
      var addWord, refreshClouds, isCollided, addChat, setTimeoutToChat;
      
      // functions
      addWord = (function(_this) {
        return function(word, src, type, ts) {
          var found, wordIdx, i;
          found = words.find(function(d) { return d.word === word; });
          if (typeof found === "undefined") {
            words.push({"word": word, "src": src, "type": type, "ts": [ts], "tsAvg": ts});
          } else {
						wordIdx = words.map(function(d) { return d.word; }).indexOf(word);
            words[wordIdx].ts.push(ts);
            words[wordIdx].tsAvg = (words[wordIdx].tsAvg * words[wordIdx].ts.length + ts) / (words[wordIdx].ts.length + 1);
            words.sort(function(a,b) { return a.ts.tsAvg < b.ts.tsAvg; }); 
          }
        };
      })(this);

      refreshClouds = (function(_this) {
        return function(newWords) {
          var textCloud, imageCloud, allCloud, bbox;
					// text-cloud
          textCloud = g.selectAll(".text-cloud")
            .data(words.filter(function(d) { return d.type === "text"; }), function(d) { return d.word; });

          textCloud.each(function(d, i) {
            this.entered = false;
          });

          textCloud.enter()
						.append("text")
            .attr("class", "text-cloud")
            .attr("dominant-baseline", "text-before-edge")
            .attr("font-family", "Helvetica")
            .attr("x", "0px")
            .attr("y", "13px")
						.text(function(d) { return d.word; })
            .each(function(d, i) { 
              this.pos = {x: 0, y:13, w:0, h:0};
              this.entered = true;
            });

          textCloud
            .attr("font-size", function(d) { return (10 + d.ts.length * 3)+"px"; })
            //.attr("y", function(d) { return (13 + d.tsAvg/20)+"px"; })
            .each(function(d, i) {
              var sel;
              sel = d3.select(this);
              this.pos.w = parseInt(sel[0][0].getBBox().width);
              this.pos.h = parseInt(sel[0][0].getBBox().height);
              this.pos.x = parseInt(sel.attr("x"));
              this.pos.y = parseInt(sel.attr("y"));
            });

					textCloud.exit()
            .remove(); 

					// image-cloud
          imageCloud = g.selectAll(".image-cloud")
            .data(words.filter(function(d) { return d.type === "image"; }), function(d) { return d.word; });

          imageCloud.each(function(d, i) {
            this.entered = false;
          });

					imageCloud.enter()
						.append("image")
						.attr("class", "image-cloud")
            .attr("x", "0px")
            .attr("y", "0px")
						.attr("xlink:href", function(d) { return d.src; })
            .each(function(d, i) { 
              this.pos = {x: 0, y:0, w:0, h:0};
              this.entered = true;
            });

          imageCloud
            .attr("width", function(d) { return (25 + d.ts.length * 3)+"px"; })
            .attr("height", function(d) { return (25 + d.ts.length * 3)+"px"; })
            //.attr("y", function(d) { return (d.tsAvg/20)+"px"; })
            .each(function(d, i) {
              var sel;
              sel = d3.select(this);
              this.pos.w = parseInt(sel.attr("width"));
              this.pos.h = parseInt(sel.attr("height"));
              this.pos.x = parseInt(sel.attr("x"));
              this.pos.y = parseInt(sel.attr("y"));
            });

          imageCloud.exit()
            .remove(); 

					// all clouds
					allCloud = g.selectAll(".text-cloud, .image-cloud")
            .data(words, function(d) { return d.word; });

          // set layout of changed words
          allCloud.filter(function(d) { return !this.entered && newWords.indexOf(d.word) !== -1; }).each(function(ad, ai) {
            // TODO
          });

          // set layout of newly entered words
          allCloud.filter(function(d) { return this.entered; }).each(function(ad, ai) {
            var a, as, again;
            a = this;
            as = d3.select(this);
            do {
              again = false;
              allCloud.filter(function(d) { return !this.entered; }).each(function(bd, bi) {
                var b, bs;
                b = this;
                bs = d3.select(this);
                if(isCollided(a.pos, b.pos)) {
                  if(a.pos.x + a.pos.w > width) {
                    a.pos.x = 0;
                    a.pos.y += (b.pos.y + b.pos.h) - a.pos.y + _this.space;   // assume that a entered after b
                  } 
                  else if(a.pos.y >= b.pos.y && a.pos.y + a.pos.h <= b.pos.y + b.pos.h) {
                    a.pos.x += (b.pos.x + b.pos.w) - a.pos.x + _this.space;;
                  }
                  else {
                    a.pos.x = 0;
                    a.pos.y += (b.pos.y + b.pos.h) - a.pos.y + _this.space;   // assume that a entered after b
                  }
                  again = true;
                }
              });
            } while (again);
            as.attr("x", a.pos.x);
            as.attr("y", a.pos.y);
            this.entered = false;
          });

          bbox = d3.select("#clouds")[0][0].getBBox();
          svg.attr("height", bbox.y + bbox.height);
          $("#clouds-container").stop().animate({scrollTop: $("#clouds").height()}, 100)
        };
      })(this);

      isCollided = (function(_this) {
        return function(a, b) {
          return a.x < b.x + b.w + _this.space && a.x + a.w + _this.space > b.x && a.y < b.y + b.h + _this.space && a.h + _this.space + a.y > b.y;
        };
      })(this);

      addChat = (function(_this) {
        return function(chat) {
          var parsed, nodearr, newWords;
          newWords = [];
          parsed = parser.parseFromString(chat.msg, "text/html"); 
          nodearr = Array.prototype.slice.call(parsed.body.childNodes);
          nodearr.forEach(function(d) {
            if(d.nodeName === "IMG") {
              var word = "("+d.alt+")";
              newWords.push(word);
              addWord(word, d.src.substring(0, d.src.lastIndexOf("/"))+"/4.0", "image", chat.ts);
            } else if (d.nodeName === "#text") {
              (d.data.trim().split(/[ ]+/)).forEach(function(word) {
                newWords.push(word);
                addWord(word, word, "text", chat.ts);
              });
            } else {
              console.error("addChat", "unexpected nodeName: " + d.nodeName);
            }
          });
          return newWords;
        };
      })(this);

      setTimeoutToChat = (function (_this) {
        return function(chat) {
          setTimeout(function() {
            var newWords;
            newWords = addChat(chat);
            refreshClouds(newWords);
          }, +chat.ts/_this.speed);
        };
      })(this);

      // operations
      margin = {top: 10, right: 10, bottom: 10, left: 10};
      width = parseInt(d3.select("#clouds-container").style("width"), 10) - margin.left - margin.right;
      height = parseInt(d3.select("#clouds-container").style("height"), 10) - margin.top - margin.bottom;

      svg = d3.select("#clouds-container").append("svg")
        .attr("id", "clouds")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top+")");

      words = [];
      parser = new DOMParser();

      //chats.forEach(function(d) {
			chats.slice(0, this.MAX_CHAT).forEach(function(d) {
        setTimeoutToChat(d);
      });
    };

    return Main;
  })();

  // $(function() { ... });
  // equals to : $(document).ready(function() { ... });
  $(function() {
    window.main = new Main();
  }); 

}).call(this);
