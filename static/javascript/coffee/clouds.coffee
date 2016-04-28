class Main
  constructor: ->
    @reftime = 0

    @speed = 1
    @timeBin = 20000
    @freqMax = 80

    # file uploader
    $("#upload-file > input:file").change(() =>
      overlay = $("<div class='overlay'> </div>")
      spinner = $("<div class='spinner'> </div>")
      
      overlay.appendTo($("body"))
      spinner.appendTo($("body"))

      form_data = new FormData($("#upload-file")[0])
      $.ajax({
        type: 'POST',
        url: '/upload',
        data: form_data,
        contentType: false,
        cache: false,
        processData: false,
        async: true,
        success: (response) =>
          parsed = JSON.parse(response)
          @reftime = +parsed[0].ts
          for d, i in parsed
            parsed[i].ts -= @reftime
          @initialize(parsed)
        error: (jqXHR, textStatus, errorThrown) ->
          alert("#{textStatus} ,  #{errorThrown}")
        complete: () =>
          overlay.remove()
          spinner.remove()
        }
      )
    )



  initialize: (chats) ->
    @initializeChats(chats)
    @initializeClouds(chats)
    $("#chats-container").perfectScrollbar()
    $("#clouds-container").perfectScrollbar()

  initializeChats: (chats) ->
    currChats = []
    addChat = (chat) =>
      currChats.push(chat)

      newChat = d3.select("#chats").selectAll(".chat")
        .data(currChats)
        .enter()
        .append("div")
        .attr("class", "chat")
      
      newChat.append("span")
        .attr("class", "time")
        .text((d) => return new Date(@reftime + d.ts).hhmmss())

      newChat.append("span")
        .attr("class", "id")
        .style("color", (d) ->
          hash = d.id.hashCode()
          return "#"+((hash & 0xFF0000)>>16).toString(16)+((hash & 0x00FF00)>>8).toString(16)+(hash & 0x0000FF).toString(16))
        .text((d) -> return d.id)

      newChat.append("span")
        .attr("class", "colon")
        .text((_) -> return ":")

      msg = newChat.append("span")
        .attr("class", "msg")

      msg.node().innerHTML = chat.msg

      $("#chats-container").stop().animate({scrollTop: $("#chats").height()}, 100)

    setTimeoutToChat = (chat) =>
      setTimeout(() =>
        addChat(chat)
      , +chat.ts/@speed)

    for chat in chats
      setTimeoutToChat(chat)

  initializeClouds: (chats) ->
    margin = {top: 30, right: 30, bottom: 30, left: 30}
    width = parseInt(d3.select("#clouds-container").style("width"), 10) - margin.left - margin.right
    height = parseInt(d3.select("#clouds-container").style("height"), 10) - margin.top - margin.bottom

    svg = d3.select("#clouds-container").append("svg")
      .attr("id", "clouds")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)

    g = svg.append("g")
      .attr("transform", "translate("+margin.left+","+margin.top+")")


    # dynamic properties
    words = []
    cloud = g.selectAll(".cloud").data(words, (d) -> return d["word"])
    parser = new DOMParser()
    addWord = (word, ts) =>
      # checks if 'words' contains 'word' already
      found = words.find((e, i, a) -> return e["word"] is word )
      if (typeof found is "undefined")
        words.push({"word": word, "ts": [ts]})
      else
        words[words.map((d) -> return d["word"]).indexOf(word)]["ts"].push(ts)

    refreshClouds = () =>
      cloud = g.selectAll(".cloud").data(words, (d) -> return d["word"])

      # ENTER
      cloud.enter()
      .append("text")
        .attr("class", "cloud")
        .attr("y", (d) -> return d["ts"][0]/10)
        .text((d) -> return d["word"])

      # ENTER + UPDATE
      cloud
        .style("font-size", (d) -> return 10+d["ts"].length*3)

      # EXIT
      cloud.data(words, (d) -> return d["word"])
        .exit()
        .remove()

      # resize svg
      bbox = d3.select("#clouds")[0][0].getBBox()
      svg.attr("height", bbox.y + bbox.height)

    addChat = (chat) =>
      parsed = parser.parseFromString(chat.msg, "text/html")
      for e in parsed.body.childNodes
        if(e.nodeName is "IMG")
          addWord("("+e.title+")", chat.ts)
        else if(e.nodeName is "#text")
          for w in e.nodeValue.split(" ")
            addWord(w, chat.ts)

      $("#clouds-container").stop().animate({scrollTop: $("#clouds").height()}, 100)

    
    ##static properties

    #hist = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    #x = d3.scale.linear()
      #.domain([0, @freqMax])
      #.range([0, width])

    #y = d3.scale.linear()
      #.domain([chats[0].ts, chats[chats.length-1].ts])
      #.range([0, height])

    #svg.append("g")
      #.attr("class", "axis")
      #.attr("transform", "translate(" + (width + margin.left) + "," + margin.top + ")")

     #dynamic properties
    #currChatList = []
    #prevIdx = 0
    #addChat = (chat) =>
      #idx = Math.ceil(chat.ts/@timeBin)
      #if idx - prevIdx > 1
        #for _idx in [(prevIdx+1)..idx]
          #currChatList[_idx] = {v: 0, idxtime: @timeBin*idx, msgList: []}
      #if currChatList[idx] is undefined
        #currChatList[idx] = {v: 1, idxtime: @timeBin*idx, msgList: [chat.msg]}
      #else
        #currChatList[idx].v++
        #currChatList[idx].msgList.push(chat.msg)
        #if currChatList[idx].v > @freqMax
          #x = d3.scale.linear()
            #.domain([0, d3.max(currChatList, (d) -> return +d.v )])
            #.range([0, width])
      #prevIdx = idx

      #binHeight = height/currChatList.length

      #y.domain([currChatList[0].idxtime, currChatList[currChatList.length-1].idxtime])

      #bars = hist.selectAll(".bar")
        
      #bars.data(currChatList)
        #.exit()
        #.remove()

      #bars.data(currChatList)
        #.enter()
        #.append("rect")
        #.attr("class", "bar")
        #.style("fill", "steelblue")
        #.on("mouseover", () ->
          #d3.select(this).style("fill", "rgb(90, 150, 200)")
        #)
        #.on("mouseout", () ->
          #d3.select(this).style("fill", "rgb(70, 130, 180)")
        #)
        #.each((d) =>
          #d.x = (width-x(d.v))/2
          #d.y = binHeight*currChatList.length
        #)

      #bars.data(currChatList)
        #.attr("height", (d) => return binHeight+1 )
        #.attr("transform", (d, i) => return "translate(" + d.x + "," + d.y + ")")
        #.transition()
        #.duration(700)
        #.ease("elastic")
        #.attr("width", (d) => return x(d.v))
        #.attr("transform", (d, i) => return "translate(" + (width-x(d.v))/2 + "," + binHeight*i+")")
        #.each((d, i) =>
          #d.x = (width-x(d.v))/2
          #d.y = binHeight*i
        #)

    setTimeoutToChat = (chat) =>
      setTimeout(() =>
        addChat(chat)
        refreshClouds()
      , +chat.ts/@speed)

    for chat in chats
      setTimeoutToChat(chat)

$ ->
  window.main = new Main
