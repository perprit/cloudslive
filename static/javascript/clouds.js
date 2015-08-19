$(function() {
	$('#upload-file > input:file').change(function() {
		var overlay = $("<div class='overlay'> </div>");
		var spinner = $("<div class='spinner'> </div>");
		overlay.appendTo($("body"));
		spinner.appendTo($("body"));

		var form_data = new FormData($('#upload-file')[0]);
		$.ajax({
			type: 'POST',
			url: '/upload',
			data: form_data,
			contentType: false,
			cache: false,
			processData: false,
			async: true,
			success: function(data) {
				d = JSON.parse(data);
				console.log(d)
				// to something
			},
			error: function(jqXHR, textStatus, errorThrown) {
				alert(textStatus + ", " + errorThrown);
			},
			complete: function() {
				overlay.remove();
				spinner.remove();
			}
		});
	});
});
