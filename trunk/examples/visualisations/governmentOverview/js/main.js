

$(document).ready(function() {

	$("#infovis").width($(window).width()-100);
	$("#infovis").height($(window).height()-31);
	
	$("div#right ul li").hover(function() {
		$(this).children().filter("div").show();
	},function() {
		$(this).children().filter("div").hide();		
	});
	
	$("select#levels").val("1");
	
	$("select#levels").change(function() {
		global_TM.canvas.opt.levelsToShow = parseInt($(this).val());
		global_TM.refresh();
		global_TM.refresh();
		restyle();
	});

	$("input[name='deputies']").val("No");

	$("input[name='deputies']").change(function(){
		if($(this).val() == "Yes") {
			global_TM.canvas.clear();
			$("#infovis").html("");
			includeDeputyDirectors = true;
			init();
    	} else if ($(this).val() == 'No') {
			global_TM.canvas.clear();
			$("#infovis").html("");
			includeDeputyDirectors = false;
			init();
   		}
	});

	$("input[name='resizeBy']").change(function(){
		if($(this).val() == "Unit") {
			global_TM.canvas.clear();
			$("#infovis").html("");
			sizeByUnits = true;
			sizeByPosts = false;
			init();
    	} else if ($(this).val() == "Post") {
			global_TM.canvas.clear();
			$("#infovis").html("");
			sizeByUnits = false;
			sizeByPosts = true;
			init();
   		}
	});		
});

function resetSourceLinks() {
	
	$("div#apiCalls a.source").click(function(){
		$("div#apiCalls div.apiCall").hide();
		$(this).next().fadeIn();
	});
	
	$("a.close").click(function(){
		$(this).parent().fadeOut();
	});
		
	return false;
}
