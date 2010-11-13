

$(document).ready(function() {

	$("#infovis").width($(window).width()-100);
	$("#infovis").height($(window).height()-36);
	
	//$("#log").corner();
	
	$("div#right ul li").hover(function() {
		$(this).children().filter("div").show();
	},function() {
		$(this).children().filter("div").hide();		
	});
	
	//$("select#levels").val("2");
	//$("input[name='deputies']").val("No");
	
	$("select#levels").val("2");
	
	$("select#levels").change(function() {
		global_TM.canvas.opt.levelsToShow = parseInt($(this).val());
		//lvlsToShow = parseInt($(this).val());
		//global_TM.canvas.clear();
		//$("#infovis").html("");
		//global_TM.loadJSON(global_govJSON);  
		global_TM.refresh();
		global_TM.refresh();
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