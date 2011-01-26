

$(document).ready(function() {

	$("#infovis").width($(window).width()-100);
	$("#infovis").height($(window).height()-31);
	
	$('div.about-tip').dialog({autoOpen:false, buttons: [
  		{
        	text: "Ok",
        	click: function() { $(this).dialog("close"); }
    	}
	], modal: true, position: 'center', title: 'About', resizable: false, width: 500, zIndex: 9999});
	
	// Breadcrumbs
	$(function() {
	    $( "button#gov" ).button({
	        text: true
	    });    
	    $( "button#dept" ).button({
	        text: true
	    });
	    $( "button#unit" ).button({
	        text: true,
	        disabled: true
	    });       
	});
	
	$( "a.aboutToggle").button().click(function() { $('div.about-tip').dialog('open'); return false;});
	
	$( "a.zoomOut").button().click(function() { 
				$("div#nodeTip").hide();
				if(rootNode.data.type == "Department"){
					rootNode = global_govJSON;
				} else {
					rootNode = prevNode;				
				}
				global_TM.out();
				global_TM.refresh();  
				restyle();
				var tempSlug;
				if(rootNode.data.type == "Department"){
					// Department node
					$("h1.title button#post").hide();
					$("h1.title button#unit").hide();
					tempSlug = rootNode.data.uri.split("/");
					tempSlug = tempSlug[tempSlug.length-1];
					$("h1.title button#dept").html(rootNode.name.valueOf()).attr('rel',tempSlug).show();
					$("h1.title button#gov").unbind('click').bind('click',function(){
						global_TM.out();
						global_TM.refresh();
						restyle();
					});					
				} else {
					// Gov node
					$("h1.title button#dept").hide();
					$("h1.title button#unit").hide();
				}	
	});

	$('.ui-state-default').mouseout(function(){$(this).removeClass('ui-state-focus')});
	
	/*
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
	*/	
	
	$('div#right').children().css('visibility','visible');
	
	init(param_dept,param_unit);
	
	
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
