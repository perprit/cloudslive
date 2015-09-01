class Main
	@reftime = 0
	constructor: ->
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

		$("#chats").perfectScrollbar()


	initialize: (data) ->
		@initializeChats(data)
		@initializeHistogram(data)

	initializeChats: (data) ->
		chats = d3.select("#chats")
		chat = chats.selectAll(".chat")
			.data(data)
			.enter()
			.append("div")
			.attr("class", "chat")
			#.style("opacity", 0)
			#.each((d) ->
				#d.top = $(this).position().top
			#)
		
		chat.append("span")
			.attr("class", "time")
			.text((d) => return new Date(@reftime + d.ts).hhmmss())

		chat.append("span")
			.attr("class", "id")
			.style("color", (d) ->
				hash = d.id.hashCode()
				return "#"+((hash & 0xFF0000)>>16).toString(16)+((hash & 0x00FF00)>>8).toString(16)+(hash & 0x0000FF).toString(16))
			.text((d) -> return d.id)

		chat.append("span")
			.attr("class", "colon")
			.text((_) -> return ":")

		chat.append("span")
			.attr("class", "msg")
			.text((d) -> return d.msg)

		#chat.transition()
			#.duration(0)
			#.delay((d) -> return d.ts/10)
			#.style("opacity", 1)
			#.each("end", (d) ->
				#console.log($(this).position().top, $(this))
				#$(this.parentNode).scrollTop(d.top)
			#)


	initializeHistogram: (data) ->
		margin = {top: 20, right: 0, bottom: 0, left: 0}
		width = parseInt(d3.select("#histogram").style("width"), 10) - margin.left - margin.right
		height = parseInt(d3.select("#histogram").style("height"), 10) - margin.top - margin.bottom

		#xAxis = d3.svg.axis().scale(x).orient("bottom")

		svg = d3.select("#histogram").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)

		hist = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		binSize = 10000		# 10 seconds
		tsList = data.map((d) -> return +d.ts )
		countList = []

		for ts in tsList
			idx = Math.ceil(ts/binSize)
			if( countList[idx] is undefined )
				countList[idx] = 1
			else
				countList[idx]++
		for count, i in countList
			if(count is undefined)
				countList[i] = 0
		
		x = d3.scale.linear()
			.domain([0, countList.length])
			.range([0, width])
		y = d3.scale.linear()
			.domain([0, d3.max(countList, (d) -> return +d )])
			.range([height, 0])

		binWidth = Math.ceil(width/countList.length)

		bars = hist.selectAll(".bar")
			.data(countList)
			.enter()
			.append("rect")
			.attr("class", "bar")
			.style("fill", "steelblue")
			.attr("width", binWidth)
			.attr("height", (d) => return height - y(d) )
			.attr("transform", (d, i) => return "translate(" + x(i) + "," + y(d)+")")


		bars.on("mouseover", () ->
			d3.select(this).style("fill", "red")
		)
		bars.on("mouseout", () ->
			d3.select(this).style("fill", "steelblue")
		)

$ ->
	window.main = new Main

	$("#behind-scroll").css("height", $("#chats").css("height"))
	$(window).resize(() ->
		$("#behind-scroll").css("height", $("#chats").css("height"))
	)
	$("#chats").scroll(() ->
		$("#behind-scroll").css("top", $(this).scrollTop())
	)
