class Main
	constructor: ->
		@reftime = 0

		@speed = 5
		@timeBin = 30000
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

		$("#chats-container").perfectScrollbar()


	initialize: (chats) ->
		@initializeChats(chats)
		@initializeHistogram(chats)

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

			newChat.append("span")
				.attr("class", "msg")
				.text((d) -> return d.msg)

			$("#chats-container").stop().animate({scrollTop: $("#chats").height()}, 100)

		setTimeoutToChat = (chat) =>
			setTimeout(() =>
				addChat(chat)
			, +chat.ts/@speed)

		for chat in chats
			setTimeoutToChat(chat)

	initializeHistogram: (chats) ->
		# static properties
		margin = {top: 0, right: 30, bottom: 0, left: 30}
		width = parseInt(d3.select("#histogram").style("width"), 10) - margin.left - margin.right
		height = parseInt(d3.select("#histogram").style("height"), 10) - margin.top - margin.bottom

		svg = d3.select("#histogram").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)

		hist = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		x = d3.scale.linear()
			.domain([0, @freqMax])
			.range([0, width])

		y = d3.scale.linear()
			.domain([chats[0].ts, chats[chats.length-1].ts])
			.range([0, height])

		svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(" + (width + margin.left) + "," + margin.top + ")")

		#yAxis = d3.svg.axis()
			#.scale(y)
			#.tickFormat((ts) -> return d3.time.format("%X")(new Date(ts)))
			#.tickSize(1)
			#.tickPadding(1)
			#.tickValues(y.domain())
			#.orient("left")

		# dynamic properties
		currChatList = []
		prevIdx = 0
		addChat = (chat) =>
			idx = Math.ceil(chat.ts/@timeBin)
			if idx - prevIdx > 1
				for _idx in [(prevIdx+1)..idx]
					currChatList[_idx] = {v: 0, idxtime: @timeBin*idx, msgList: []}
			if currChatList[idx] is undefined
				currChatList[idx] = {v: 1, idxtime: @timeBin*idx, msgList: [chat.msg]}
			else
				currChatList[idx].v++
				currChatList[idx].msgList.push(chat.msg)
				if currChatList[idx].v > @freqMax
					x = d3.scale.linear()
						.domain([0, d3.max(currChatList, (d) -> return +d.v )])
						.range([0, width])
			prevIdx = idx

			binHeight = height/currChatList.length

			y.domain([currChatList[0].idxtime, currChatList[currChatList.length-1].idxtime])

			bars = hist.selectAll(".bar")
				
			bars.data(currChatList)
				.exit()
				.remove()

			bars.data(currChatList)
				.enter()
				.append("rect")
				.attr("class", "bar")
				.style("fill", "steelblue")
				.on("mouseover", () ->
					d3.select(this).style("fill", "rgb(90, 150, 200)")
				)
				.on("mouseout", () ->
					d3.select(this).style("fill", "rgb(70, 130, 180)")
				)
				.each((d) =>
					d.x = (width-x(d.v))/2
					d.y = binHeight*currChatList.length
				)

			bars.data(currChatList)
				.attr("height", (d) => return binHeight+1 )
				.attr("transform", (d, i) => return "translate(" + d.x + "," + d.y + ")")
				.transition()
				.duration(700)
				.ease("elastic")
				.attr("width", (d) => return x(d.v))
				.attr("transform", (d, i) => return "translate(" + (width-x(d.v))/2 + "," + binHeight*i+")")
				.each((d, i) =>
					d.x = (width-x(d.v))/2
					d.y = binHeight*i
				)

		setTimeoutToChat = (chat) =>
			setTimeout(() =>
				addChat(chat)
			, +chat.ts/@speed)

		for chat in chats
			setTimeoutToChat(chat)

		#margin = {top: 0, right: 10, bottom: 0, left: 10}
		#width = parseInt(d3.select("#histogram").style("width"), 10) - margin.left - margin.right
		#height = parseInt(d3.select("#histogram").style("height"), 10) - margin.top - margin.bottom

		#svg = d3.select("#histogram").append("svg")
			#.attr("width", width + margin.left + margin.right)
			#.attr("height", height + margin.top + margin.bottom)

		#hist = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		## dynamic properties
		#timeBin = 10000		# 10 seconds
		#freqList = []

		#for chat in chats
			#idx = Math.ceil(chat.ts/timeBin)
			#if freqList[idx] is undefined
				#freqList[idx] = {v: 1, ts: undefined, msgList: [chat.msg]}
			#else
				#freqList[idx].v++
				#freqList[idx].msgList.push(chat.msg)
		#for freq, i in freqList
			#if freq is undefined
				#freqList[i] = {v: 0, ts: @reftime + timeBin*i}
			#else
				#freqList[i].ts = @reftime + timeBin*i

		#x = d3.scale.linear()
			#.domain([0, d3.max(freqList, (d) -> return +d.v )])
			#.range([0, width])
		#y = d3.scale.linear()
			#.domain([freqList[0].ts, freqList[freqList.length-1].ts])
			#.range([0, height])

		#yAxis = d3.svg.axis()
			#.scale(y)
			#.tickFormat((ts) -> return d3.time.format("%X")(new Date(ts)))
			#.tickSize(1)
			#.tickPadding(1)
			#.tickValues(y.domain())
			#.orient("left")

		#svg.append("g")
			#.attr("class", "axis")
			#.attr("transform", "translate(" + (width + margin.left) + "," + margin.top + ")")
			#.call(yAxis)

		#binHeight = Math.ceil(height/freqList.length)

		#bars = hist.selectAll(".bar")
			#.data(freqList)
			#.enter()
			#.append("rect")
			#.attr("class", "bar")
			#.style("fill", "steelblue")
			#.attr("width", (d) => return x(d.v))
			#.attr("height", (d) => return binHeight )
			#.attr("transform", (d, i) => return "translate(" + (width-x(d.v))/2 + "," + y(d.ts)+")")

		#bars.on("mouseover", () ->
			#d3.select(this).style("fill", "rgb(90, 150, 200)")
		#)
		#bars.on("mouseout", () ->
			#d3.select(this).style("fill", "rgb(70, 130, 180)")
		#)

$ ->
	window.main = new Main
