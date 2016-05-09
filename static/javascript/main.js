(function() {
  var Main;

  Main = (function() {
    // constructor
    function Main() {
      this.reftime = 0;
      this.speed = 1;
      this.timeBin = 20000;
      this.freqMax = 80;
      $("#upload-file > input:file").change((function(_this) {
        return function() {
          var form_data, overlay, spinner;
          overlay = $("<div class='overlay'> </div>");
          spinner = $("<div classs'spinner'> </div>");
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
              parsed.forEach(function(curr) {
                curr.ts -= _this.reftime;
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
    };

    // member functions
    Main.prototype.initialize = function (chats) {
      this.initializeChats(chats);
      //this.initializeClouds(chats);
      $("#chats-container").perfectScrollbar();
      $("#clouds-container").perfectScrollbar();
    };

    Main.prototype.initializeChats = function (chats) {
      var currChats, addChat, setTimeoutToChat;
      currChats = [];
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

      chats.forEach(function(curr) {
        setTimeoutToChat(curr);
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
